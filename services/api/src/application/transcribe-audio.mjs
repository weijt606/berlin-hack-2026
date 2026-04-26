import { InvalidInput, ServiceUnavailable } from '../domain/errors.mjs';
import { computeWer } from '../domain/wer.mjs';
import {
  wavToPcm16kMono,
  computeAudioMetrics,
} from '../infrastructure/audio-metrics.mjs';

// Fall back to raw if the enhancer over-suppressed the input. We've seen
// AIC at level 0.8 mute close-talk speech on short / quiet utterances —
// noise floor pinned at -120dB and rms dropping 30-90dB — at which point
// whisper hallucinates a one-word filler ("Done.", "You.", "AppleTron.").
// Heuristics: if enhanced collapsed loudness OR shrank to a fraction of
// the raw text, the raw decode is almost always closer to truth.
function wordCount(s) {
  return (s || '').trim().split(/\s+/).filter(Boolean).length;
}
export function pickBetterTranscript(raw, enhanced) {
  if (!enhanced) return { text: raw.text || '', source: 'raw' };
  if (!raw) return { text: enhanced.text || '', source: 'enhanced' };
  const rWords = wordCount(raw.text);
  const eWords = wordCount(enhanced.text);
  // Empty enhanced + non-trivial raw → keep raw.
  if (!eWords && rWords > 0) return { text: raw.text, source: 'raw-enh-empty' };
  // Enhancer collapsed loudness (rms dropped >20dB) AND shortened the text
  // by >50% — strong "the enhancer ate the signal" signature.
  const rmsDrop = (raw.metrics?.rmsDb ?? 0) - (enhanced.metrics?.rmsDb ?? 0);
  if (rmsDrop > 20 && eWords < rWords * 0.5) {
    return { text: raw.text, source: 'raw-enh-collapsed' };
  }
  // Default: prefer enhanced (the original pre-fix behaviour).
  return { text: enhanced.text || raw.text || '', source: 'enhanced' };
}

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
 *   stageDumpStore?: { beginTake: (sessionId: string|null) => null | {
 *     dir: string,
 *     wav: (name: string, buf: Buffer) => void,
 *     text: (name: string, str: string) => void,
 *     json: (name: string, obj: object) => void,
 *   } } | null,
 *   transcriptNormalizer?: { normalize: (raw: string) => Promise<string> } | null,
 * }} deps
 */
export function makeTranscribeAudio({
  transcriber,
  audioEnhancer,
  metricsStore = null,
  stageDumpStore = null,
  transcriptNormalizer = null,
}) {
  return async function transcribeAudio({
    wavBuffer,
    compare = true,
    language,
    sessionId,
    enhancementLevel,
    enhancementScene,
  }) {
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
    const take = stageDumpStore ? stageDumpStore.beginTake(sessionId ?? null) : null;
    take?.wav('raw', wavBuffer);

    const decoded = wavToPcm16kMono(wavBuffer);
    const rawMetrics = computeAudioMetrics(decoded.pcm);

    const sttStartedAt = Date.now();
    const rawResult = await transcriber.transcribe(decoded.pcm, { language });
    const rawSttMs = Date.now() - sttStartedAt;
    take?.text('raw', rawResult.text);

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
      const enhancedWav = await audioEnhancer.enhance(wavBuffer, {
        level: enhancementLevel,
      });
      const enhanceMs = Date.now() - enhanceStartedAt;
      take?.wav('enhanced', enhancedWav);
      const decodedEnhanced = wavToPcm16kMono(enhancedWav);
      const enhancedMetrics = computeAudioMetrics(decodedEnhanced.pcm);

      const enhSttStartedAt = Date.now();
      const enhResult = await transcriber.transcribe(decodedEnhanced.pcm, { language });
      const enhSttMs = Date.now() - enhSttStartedAt;
      take?.text('enhanced', enhResult.text);

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

    let { text: rawRecommended, source: pickSource } = pickBetterTranscript(raw, enhanced);

    // Final guard against silence-fed hallucinations. Whisper invents fillers
    // ("Thanks for watching.", "you", "Music playing in the background.")
    // whenever the decode source is nearly silent. The picked source's
    // voicedRatio is the cleanest signal that "there was no real speech".
    // < 0.10 means basically the whole window was unvoiced — drop the text
    // and let the frontend show "didn't catch that".
    const pickedMetrics = pickSource.startsWith('raw') ? raw.metrics : enhanced?.metrics;
    const voicedRatio = pickedMetrics?.voicedRatio ?? 1;
    if (rawRecommended && voicedRatio < 0.1) {
      pickSource = `${pickSource}-vad-rejected`;
      rawRecommended = '';
    }
    take?.text('picked', `${pickSource}: ${rawRecommended}`);

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
      pickSource,
      enhancementLevel: typeof enhancementLevel === 'number' ? enhancementLevel : null,
      enhancementScene: enhancementScene || null,
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

    if (take) {
      take.text('final', text);
      take.json('meta', { sessionId: sessionId ?? null, ...record });
    }

    return record;
  };
}
