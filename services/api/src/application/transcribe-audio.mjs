import { InvalidInput, ServiceUnavailable } from '../domain/errors.mjs';
import { computeWer } from '../domain/wer.mjs';
import {
  wavToPcm16kMono,
  computeAudioMetrics,
} from '../infrastructure/audio-metrics.mjs';

/**
 * Use case: transcribe an uploaded WAV. When the AIC enhancer is configured
 * and `compare` is requested (default), runs Whisper twice — once on the
 * raw audio, once on the enhanced audio — and persists both texts plus
 * loudness / SNR / WER metrics to the metrics store so we can audit the
 * enhancement quality offline.
 *
 * Returned `text` is the recommended transcript: enhanced if available,
 * else raw. The caller posts that to `/generate` unchanged.
 *
 * @param {{
 *   transcriber: import('./ports.mjs').Transcriber | null,
 *   audioEnhancer: import('./ports.mjs').AudioEnhancer | null,
 *   metricsStore?: { append: (record: object) => Promise<void> } | null,
 *   transcriptNormalizer?: { normalize: (raw: string) => Promise<string> } | null,
 * }} deps
 */
export function makeTranscribeAudio({
  transcriber,
  audioEnhancer,
  metricsStore = null,
  transcriptNormalizer = null,
}) {
  return async function transcribeAudio({ wavBuffer, compare = true, language, sessionId }) {
    if (!transcriber) {
      throw new ServiceUnavailable(
        'Whisper is not initialised. Check WHISPER_MODEL and that the model can be downloaded.',
      );
    }
    if (!Buffer.isBuffer(wavBuffer) || wavBuffer.length === 0) {
      throw new InvalidInput(
        'POST a WAV file as the request body (Content-Type: audio/wav).',
      );
    }

    const startedAt = Date.now();
    const decoded = wavToPcm16kMono(wavBuffer);
    const rawMetrics = computeAudioMetrics(decoded.pcm);

    const sttStartedAt = Date.now();
    const rawResult = await transcriber.transcribe(decoded.pcm, { language });
    const rawSttMs = Date.now() - sttStartedAt;

    const raw = {
      text: rawResult.text,
      metrics: rawMetrics,
      sttMs: rawSttMs,
    };

    let enhanced = null;
    let comparison = null;

    const wantEnhanced = compare && audioEnhancer;
    if (wantEnhanced) {
      const enhanceStartedAt = Date.now();
      const enhancedWav = await audioEnhancer.enhance(wavBuffer);
      const enhanceMs = Date.now() - enhanceStartedAt;
      const decodedEnhanced = wavToPcm16kMono(enhancedWav);
      const enhancedMetrics = computeAudioMetrics(decodedEnhanced.pcm);

      const enhSttStartedAt = Date.now();
      const enhResult = await transcriber.transcribe(decodedEnhanced.pcm, { language });
      const enhSttMs = Date.now() - enhSttStartedAt;

      enhanced = {
        text: enhResult.text,
        metrics: enhancedMetrics,
        sttMs: enhSttMs,
        enhanceMs,
      };

      comparison = {
        // anchor on enhanced as the "reference" — the assumption being
        // enhanced is closer to ground truth in noisy conditions
        wer: computeWer(enhanced.text, raw.text),
        rmsDeltaDb:
          Math.round((enhanced.metrics.rmsDb - raw.metrics.rmsDb) * 10) / 10,
        snrDeltaDb:
          Math.round((enhanced.metrics.estSnrDb - raw.metrics.estSnrDb) * 10) /
          10,
        noiseFloorDeltaDb:
          Math.round(
            (enhanced.metrics.noiseFloorDb - raw.metrics.noiseFloorDb) * 10,
          ) / 10,
      };
    }

    const rawRecommended = enhanced?.text || raw.text;

    // Optional: tiny LLM cleanup pass to fix STT errors that the static
    // post-process dictionary in whisper-transcriber can't handle (artist
    // names, half-heard phrases, fillers). On error or noop the normalizer
    // returns the original text unchanged.
    let text = rawRecommended;
    let normalizeMs = null;
    if (transcriptNormalizer && rawRecommended) {
      const t0 = Date.now();
      try {
        text = await transcriptNormalizer.normalize(rawRecommended);
      } catch (err) {
        console.warn(`[transcribe] normalize threw: ${err.message}`);
      }
      normalizeMs = Date.now() - t0;
    }

    const totalMs = Date.now() - startedAt;

    const record = {
      text,
      rawText: rawRecommended,
      raw,
      enhanced,
      comparison,
      normalizeMs,
      sttModel: transcriber.getModelId(),
      enhancerModel: audioEnhancer ? audioEnhancer.getModelId() : null,
      audio: {
        durationMs: decoded.durationMs,
        originalSampleRate: decoded.originalSampleRate,
        channels: decoded.channels,
      },
      totalMs,
    };

    if (metricsStore) {
      // Persist asynchronously; don't block the response on disk I/O,
      // but log if the write fails so we don't silently lose evidence.
      metricsStore
        .append({ sessionId: sessionId ?? null, ...record })
        .catch((err) => console.error('metrics append failed:', err));
    }

    return record;
  };
}
