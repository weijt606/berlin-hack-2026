import { InvalidInput, ServiceUnavailable, UpstreamError } from '../domain/errors.mjs';

/**
 * Voice prompt pipeline:
 *   raw WAV (from mic, possibly noisy)
 *     → ai-coustics enhance (denoise / dereverb)
 *     → STT (Gemini multimodal)
 *     → transcript text
 *
 * Output is consumed by the front-end which drops the transcript into the
 * Vibe prompt textarea and triggers the regular /generate flow. Keeping
 * STT separate from /generate means the user can still review / edit the
 * transcript before LLM inference runs.
 *
 * @param {{
 *   audioEnhancer: import('./ports.mjs').AudioEnhancer | null,
 *   sttClient: import('./ports.mjs').SttClient | null,
 *   transcriptNormalizer?: { normalize: (raw: string) => Promise<string> } | null,
 * }} deps
 */
export function makeVoicePrompt({ audioEnhancer, sttClient, transcriptNormalizer = null }) {
  return async function voicePrompt({ wavBuffer, languageHint }) {
    if (!audioEnhancer) {
      throw new ServiceUnavailable('AIC_SDK_LICENSE is not set in the root .env file.');
    }
    if (!sttClient) {
      throw new ServiceUnavailable('STT not configured (needs GEMINI_API_KEY).');
    }
    if (!Buffer.isBuffer(wavBuffer) || wavBuffer.length === 0) {
      throw new InvalidInput('POST a WAV file as the request body (Content-Type: audio/wav).');
    }

    let enhanced;
    try {
      enhanced = await audioEnhancer.enhance(wavBuffer);
    } catch (err) {
      throw new UpstreamError(`enhance failed: ${err.message}`);
    }

    let result;
    try {
      result = await sttClient.transcribe({ wavBuffer: enhanced, languageHint });
    } catch (err) {
      throw new UpstreamError(`stt failed: ${err.message}`);
    }

    // Optional: run the raw transcript through a small LLM "cleanup" pass to
    // fix STT errors that aren't covered by whisper-stt's static dictionary
    // (e.g., novel artist names, half-heard phrases). On error or noop the
    // normalizer returns the raw transcript unchanged.
    const rawText = result.text;
    let text = rawText;
    if (transcriptNormalizer && rawText) {
      try {
        text = await transcriptNormalizer.normalize(rawText);
      } catch (err) {
        // Non-fatal: keep the raw, just log.
        console.warn(`[voice-prompt] normalize threw: ${err.message}`);
      }
    }

    return {
      text,
      rawText,
      sttModel: result.model,
      enhancedBytes: enhanced.length,
      originalBytes: wavBuffer.length,
    };
  };
}
