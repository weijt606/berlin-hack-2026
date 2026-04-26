import { InvalidInput } from '../domain/errors.mjs';

const SESSION_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

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

/**
 * Use cases for a persistent chat session: send a turn (which delegates
 * to generateStrudel and appends the result), read the message log,
 * clear it.
 *
 * @param {{
 *   sessionStore: import('./ports.mjs').SessionStore,
 *   generateStrudel: ReturnType<typeof import('./generate-strudel.mjs').makeGenerateStrudel>,
 * }} deps
 */
export function makeChatSession({ sessionStore, generateStrudel }) {
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

    async sendTurn({ sessionId, prompt, currentCode }) {
      assertSessionId(sessionId);
      if (typeof prompt !== 'string' || prompt.trim() === '') {
        throw new InvalidInput('Body must include a non-empty string `prompt` field.');
      }

      const record = await sessionStore.load(sessionId);
      const history = toLlmHistory(record.messages);

      const result = await generateStrudel({
        prompt,
        currentCode,
        history,
      });

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
        const msg = { role: 'assistant', code: result.code, ts };
        if (result.viz) msg.viz = result.viz;
        record.messages.push(msg);
      }
      await sessionStore.save(record);

      return {
        code: result.code,
        viz: result.viz,
        message: result.message,
        noChange: !!result.noChange,
        model: result.model,
        messages: record.messages,
      };
    },
  };
}
