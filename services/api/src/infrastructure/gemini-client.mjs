import { GoogleGenAI } from '@google/genai';

/**
 * Returns an LlmClient implementation, or `null` if no API key is configured.
 * Returning null lets the composition root keep wiring the rest of the app
 * and surface a 503 at request time instead of crashing on boot.
 *
 * @param {{ apiKey: string | null, model: string, temperature?: number }} cfg
 * @returns {import('../application/ports.mjs').LlmClient | null}
 */
export function createGeminiClient({ apiKey, model, temperature = 0.7 }) {
  if (!apiKey) return null;
  const genai = new GoogleGenAI({ apiKey });

  return {
    async complete({ systemPrompt, userMessage }) {
      const response = await genai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        config: { systemInstruction: systemPrompt, temperature },
      });
      return { text: response.text ?? '', model };
    },
  };
}
