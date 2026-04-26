import { InvalidInput, ServiceUnavailable, UpstreamError } from '../domain/errors.mjs';

const FENCE_RE = /^```(?:javascript|js|strudel)?\n([\s\S]*?)\n```$/;

// Visualization is now picked by the Pioneer-trained classifier in a
// separate /recommend-viz call (see application/recommend-viz.mjs). The
// main LLM no longer chooses it, but we still strip a leading `// viz:`
// comment defensively so any cached/in-flight skill-prompt revision that
// still emits one doesn't leak into the editor as a stray comment.
const STALE_VIZ_HINT_RE = /^\s*\/\/\s*viz\s*:\s*[a-zA-Z_-]+\s*\r?\n/;

function stripStaleVizHint(text) {
  return text.replace(STALE_VIZ_HINT_RE, '');
}

// Sentinel emitted by the model when the request can't be turned into a
// pattern — see skills/strudel/rules/cannot-handle.md. Detected here so we
// can flag the response and prevent the editor from being overwritten.
export const CANNOT_HANDLE_SENTINEL = 'Couldn’t generate or modify — please try again.';
const CANNOT_HANDLE_PLAIN = "Couldn't generate or modify - please try again.";

function stripCodeFences(text) {
  const m = text.match(FENCE_RE);
  return m ? m[1] : text;
}

function isCannotHandle(text) {
  // Be lenient with smart-vs-straight quotes and em-dashes since the model
  // sometimes "auto-corrects" punctuation.
  const norm = text
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return (
    norm === CANNOT_HANDLE_PLAIN.toLowerCase() ||
    norm === CANNOT_HANDLE_PLAIN.toLowerCase().replace(/\.$/, '')
  );
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const out = [];
  for (const turn of history) {
    if (!turn || typeof turn.text !== 'string') continue;
    if (turn.role !== 'user' && turn.role !== 'assistant') continue;
    out.push({ role: turn.role, text: turn.text });
  }
  return out;
}

/**
 * @param {{
 *   llmClient: import('./ports.mjs').LlmClient | null,
 *   loadSystemPrompt: import('./ports.mjs').SystemPromptProvider,
 * }} deps
 */
export function makeGenerateStrudel({ llmClient, loadSystemPrompt }) {
  return async function generateStrudel({ prompt, currentCode, history }) {
    if (!llmClient) {
      throw new ServiceUnavailable('GEMINI_API_KEY is not set in the root .env file.');
    }
    if (typeof prompt !== 'string' || prompt.trim() === '') {
      throw new InvalidInput('Body must include a non-empty string `prompt` field.');
    }

    const turns = sanitizeHistory(history);
    const userMessage = currentCode
      ? `<current>\n${currentCode}\n</current>\n\n${prompt}`
      : prompt;

    // Re-read on every request so prompt edits don't require a restart.
    const systemPrompt = await loadSystemPrompt();

    let completion;
    try {
      completion = await llmClient.complete({
        systemPrompt,
        userMessage,
        history: turns,
      });
    } catch (err) {
      throw new UpstreamError(`Gemini error: ${err.message}`);
    }

    const cleaned = stripCodeFences((completion.text ?? '').trim());

    if (isCannotHandle(cleaned)) {
      return {
        code: '',
        message: CANNOT_HANDLE_SENTINEL,
        noChange: true,
        model: completion.model,
      };
    }

    return {
      code: stripStaleVizHint(cleaned),
      model: completion.model,
    };
  };
}
