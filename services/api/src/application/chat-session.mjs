import { InvalidInput } from '../domain/errors.mjs';

const SESSION_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
// How many extra LLM round-trips we'll spend asking the model to fix a
// pattern that fails server-side validation. Two retries catches almost
// every transient regression we've seen without blowing the latency
// budget for the user-visible turn.
const MAX_VALIDATION_RETRIES = 2;

function assertSessionId(id) {
  if (typeof id !== 'string' || !SESSION_ID_RE.test(id)) {
    throw new InvalidInput('Body must include a valid `sessionId` (1–64 chars: letters, digits, _, -).');
  }
}

function toLlmHistory(messages) {
  const out = [];
  for (const msg of messages) {
    if (msg.role === 'assistant' && typeof msg.code === 'string') {
      out.push({ role: 'assistant', text: msg.code });
    } else if (msg.role === 'user' && typeof msg.text === 'string') {
      out.push({ role: 'user', text: msg.text });
    }
  }
  return out;
}

function buildFixPrompt(error, code) {
  return [
    `[validation error] The previous code failed: ${error}`,
    'Return ONLY the corrected Strudel code (no prose, no fences) that fixes this error.',
    'Keep the user\'s original intent. Obey all output-format rules.',
    `<failing>\n${code}\n</failing>`,
  ].join('\n\n');
}

/**
 * Use cases for a persistent chat session: send a turn (which delegates
 * to generateStrudel and appends the result), read the message log,
 * clear it.
 *
 * @param {{
 *   sessionStore: import('./ports.mjs').SessionStore,
 *   generateStrudel: ReturnType<typeof import('./generate-strudel.mjs').makeGenerateStrudel>,
 *   validatePattern?: (code: string) => Promise<{ valid: boolean, error?: string }>,
 * }} deps
 */
export function makeChatSession({ sessionStore, generateStrudel, validatePattern }) {
  // Run the LLM, then loop validate→retry until the pattern is sane or
  // we've burned MAX_VALIDATION_RETRIES extra calls. Last-attempt code is
  // returned regardless so the user always sees something — annotated with
  // `validated: false` plus the error so the client can decide how loud to
  // be about it.
  async function generateValidated({ prompt, currentCode, history }) {
    let result = await generateStrudel({ prompt, currentCode, history });
    if (result.noChange || !validatePattern) {
      return { ...result, validated: !validatePattern ? undefined : true };
    }
    let validation = await validatePattern(result.code);
    let attempts = 1;
    while (!validation.valid && attempts <= MAX_VALIDATION_RETRIES) {
      const fixPrompt = buildFixPrompt(validation.error, result.code);
      const next = await generateStrudel({
        prompt: fixPrompt,
        currentCode: result.code,
        history,
      });
      attempts++;
      if (next.noChange) break;
      result = next;
      validation = await validatePattern(result.code);
    }
    return {
      ...result,
      validated: validation.valid,
      validationError: validation.valid ? undefined : validation.error,
      validationAttempts: attempts,
    };
  }

  return {
    async getMessages(sessionId) {
      assertSessionId(sessionId);
      const record = await sessionStore.load(sessionId);
      return { id: record.id, messages: record.messages };
    },

    async clear(sessionId) {
      assertSessionId(sessionId);
      await sessionStore.clear(sessionId);
    },

    // Stateless one-shot: no session history loaded, no messages stored.
    // Used by the client-side runtime-error recovery loop, where appending
    // synthetic "fix this NaN" turns to the user-visible chat would be noise.
    async fix({ currentCode, error }) {
      if (typeof currentCode !== 'string' || currentCode.trim() === '') {
        throw new InvalidInput('Body must include a non-empty string `currentCode` field.');
      }
      if (typeof error !== 'string' || error.trim() === '') {
        throw new InvalidInput('Body must include a non-empty string `error` field.');
      }
      const fixPrompt = buildFixPrompt(error, currentCode);
      const result = await generateValidated({
        prompt: fixPrompt,
        currentCode,
        history: [],
      });
      return {
        code: result.code,
        message: result.message,
        noChange: !!result.noChange,
        model: result.model,
        validated: result.validated,
        validationError: result.validationError,
        validationAttempts: result.validationAttempts,
      };
    },

    async sendTurn({ sessionId, prompt, currentCode }) {
      assertSessionId(sessionId);
      if (typeof prompt !== 'string' || prompt.trim() === '') {
        throw new InvalidInput('Body must include a non-empty string `prompt` field.');
      }

      const record = await sessionStore.load(sessionId);
      const history = toLlmHistory(record.messages);

      const result = await generateValidated({ prompt, currentCode, history });

      const ts = new Date().toISOString();
      record.messages.push({ role: 'user', text: prompt, ts });
      if (result.noChange) {
        // Keep the user-visible message but skip pushing assistant `code`,
        // so the LLM history transformer drops it on the next turn.
        record.messages.push({
          role: 'assistant',
          text: result.message,
          noChange: true,
          ts,
        });
      } else {
        record.messages.push({ role: 'assistant', code: result.code, ts });
      }
      await sessionStore.save(record);

      return {
        code: result.code,
        message: result.message,
        noChange: !!result.noChange,
        model: result.model,
        messages: record.messages,
        validated: result.validated,
        validationError: result.validationError,
        validationAttempts: result.validationAttempts,
      };
    },
  };
}
