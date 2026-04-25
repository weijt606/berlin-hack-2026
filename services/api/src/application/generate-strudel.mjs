import { InvalidInput, ServiceUnavailable, UpstreamError } from '../domain/errors.mjs';

const FENCE_RE = /^```(?:javascript|js|strudel)?\n([\s\S]*?)\n```$/;

function stripCodeFences(text) {
  const m = text.match(FENCE_RE);
  return m ? m[1] : text;
}

/**
 * @param {{ llmClient: import('./ports.mjs').LlmClient | null, systemPrompt: string }} deps
 */
export function makeGenerateStrudel({ llmClient, systemPrompt }) {
  return async function generateStrudel({ prompt, currentCode }) {
    if (!llmClient) {
      throw new ServiceUnavailable('GEMINI_API_KEY is not set in the root .env file.');
    }
    if (typeof prompt !== 'string' || prompt.trim() === '') {
      throw new InvalidInput('Body must include a non-empty string `prompt` field.');
    }

    const userMessage = currentCode
      ? `<current>\n${currentCode}\n</current>\n\n${prompt}`
      : prompt;

    let completion;
    try {
      completion = await llmClient.complete({ systemPrompt, userMessage });
    } catch (err) {
      throw new UpstreamError(`Gemini error: ${err.message}`);
    }

    return {
      code: stripCodeFences((completion.text ?? '').trim()),
      model: completion.model,
    };
  };
}
