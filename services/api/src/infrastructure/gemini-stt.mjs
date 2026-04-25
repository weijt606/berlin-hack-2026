import { GoogleGenAI } from '@google/genai';

/**
 * Gemini multimodal STT. Sends a WAV buffer inline as a Gemini audio part and
 * asks for a verbatim transcript. Quality is good for English / EN+CN mixed
 * speech and the same key/quota as the text generator. If the user has hit
 * the quota cap, this will 429 too — but it's the cheapest path to "STT
 * with no extra dependency" in our stack.
 *
 * @param {{ apiKey: string | null, model: string }} cfg
 * @returns {import('../application/ports.mjs').SttClient | null}
 */
export function createGeminiStt({ apiKey, model }) {
  if (!apiKey) return null;
  const genai = new GoogleGenAI({ apiKey });

  return {
    async transcribe({ wavBuffer, languageHint }) {
      const base64 = wavBuffer.toString('base64');
      const langLine = languageHint
        ? `Expected language: ${languageHint}.`
        : 'The speaker may use English, Mandarin, or a mix — transcribe each part in its own script.';
      const response = await genai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: 'audio/wav', data: base64 } },
              {
                text: [
                  'Transcribe the speech in this audio verbatim.',
                  langLine,
                  'Return only the transcribed words. No quotes, no commentary, no time stamps, no language tags.',
                ].join(' '),
              },
            ],
          },
        ],
        config: { temperature: 0 },
      });
      const text = (response.text ?? '').trim();
      return { text, model: response.modelVersion ?? model };
    },
  };
}
