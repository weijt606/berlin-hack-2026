import { GoogleGenAI } from '@google/genai';

/**
 * Returns an LlmClient implementation, or `null` if no API key is configured.
 * Returning null lets the composition root keep wiring the rest of the app
 * and surface a 503 at request time instead of crashing on boot.
 *
 * @param {{ apiKey: string | null, model: string, temperature?: number }} cfg
 * @returns {import('../application/ports.mjs').LlmClient | null}
 */
// 0.85 instead of the more common 0.7 default — for live-coding music we
// actively WANT the model to spread across drum kits, scales, and visualizers
// rather than collapse onto its single highest-likelihood "lo-fi LinnDrum +
// Rhodes" template every time. Combined with rules/diversity.md this gives a
// noticeably more varied set output. Override via env if a particular voice
// is needed.
export function createGeminiClient({ apiKey, model, temperature }) {
  const t = Number.isFinite(temperature) ? temperature
    : Number.isFinite(Number(process.env.GEMINI_TEMPERATURE)) ? Number(process.env.GEMINI_TEMPERATURE)
    : 0.85;
  if (!apiKey) return null;
  const genai = new GoogleGenAI({ apiKey });

  return {
    async complete({ systemPrompt, userMessage, history = [] }) {
      const contents = history.map((turn) => ({
        role: turn.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: turn.text }],
      }));
      contents.push({ role: 'user', parts: [{ text: userMessage }] });

      const response = await genai.models.generateContent({
        model,
        contents,
        config: { systemInstruction: systemPrompt, temperature: t },
      });
      return { text: response.text ?? '', model };
    },
  };
}
