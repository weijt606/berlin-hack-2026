import { mkdirSync } from 'node:fs';
import wavefile from 'wavefile';
import { Model, Processor, ProcessorParameter } from '@ai-coustics/aic-sdk';

const { WaveFile } = wavefile;

/**
 * Returns an AudioEnhancer implementation, or `null` if no license is configured.
 * Downloads the model on construction (first call only — the SDK caches by id).
 *
 * @param {{
 *   licenseKey: string | null,
 *   modelId: string,
 *   modelsDir: string,
 *   enhancementLevel?: number,
 * }} cfg
 * @returns {import('../application/ports.mjs').AudioEnhancer | null}
 */
export function createAicProcessor({ licenseKey, modelId, modelsDir, enhancementLevel = 0.8 }) {
  if (!licenseKey) return null;

  mkdirSync(modelsDir, { recursive: true });
  const modelPath = Model.download(modelId, modelsDir);
  const model = Model.fromFile(modelPath);

  // Cache a Processor per (sampleRate × numChannels) signature. The first
  // call instantiates + initializes the processor (~250ms for the model);
  // subsequent calls of the same shape reuse the same instance (~30-50ms).
  // The previous implementation recreated the Processor on every call, which
  // ballooned to 5+ seconds after a few invocations as native handles piled
  // up — this cache fixes the "ai-coustics gets slower over time" regression.
  /** @type {Map<string, { processor: any, numFrames: number }>} */
  const processorCache = new Map();

  function getProcessor(sampleRate, numChannels) {
    const key = `${sampleRate}x${numChannels}`;
    let cached = processorCache.get(key);
    if (cached) return cached;
    const numFrames = model.getOptimalNumFrames(sampleRate);
    const processor = new Processor(model, licenseKey);
    processor.initialize(sampleRate, numChannels, numFrames, false);
    processor
      .getProcessorContext()
      .setParameter(ProcessorParameter.EnhancementLevel, enhancementLevel);
    // Track the level currently set on this native processor so the
    // per-call override in enhance() only re-issues setParameter when
    // it actually changes (the SDK call traverses an FFI boundary).
    cached = { processor, numFrames, currentLevel: enhancementLevel };
    processorCache.set(key, cached);
    return cached;
  }

  function clamp01(n) {
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.min(1, n));
  }

  return {
    getModelId: () => model.getId(),
    /**
     * @param {Buffer} wavBuffer
     * @param {{ level?: number }} [opts]  per-call override; falls back to the
     *                                     constructor-time `enhancementLevel`
     */
    async enhance(wavBuffer, opts = {}) {
      const wav = new WaveFile(wavBuffer);
      wav.toBitDepth('32f');

      const sampleRate = wav.fmt.sampleRate;
      const numChannels = wav.fmt.numChannels;
      const samples = wav.getSamples(true, Float32Array);

      const cached = getProcessor(sampleRate, numChannels);
      const { processor, numFrames } = cached;

      // Apply a per-call level override if provided. Same processor is
      // reused across requests, so only push the parameter through the
      // FFI when it actually changes — saves a few microseconds and
      // avoids the SDK re-initialising any internal state.
      const requestedLevel = clamp01(opts?.level);
      const effectiveLevel = requestedLevel ?? enhancementLevel;
      if (effectiveLevel !== cached.currentLevel) {
        processor
          .getProcessorContext()
          .setParameter(ProcessorParameter.EnhancementLevel, effectiveLevel);
        cached.currentLevel = effectiveLevel;
      }

      const chunkSize = numChannels * numFrames;
      for (let i = 0; i < samples.length; i += chunkSize) {
        if (i + chunkSize <= samples.length) {
          processor.processInterleaved(samples.subarray(i, i + chunkSize));
        } else {
          // Last partial chunk: pad to chunkSize, process, copy result back.
          const padded = new Float32Array(chunkSize);
          padded.set(samples.subarray(i));
          processor.processInterleaved(padded);
          samples.set(padded.subarray(0, samples.length - i), i);
        }
      }

      const channels = Array.from(
        { length: numChannels },
        () => new Float32Array(samples.length / numChannels),
      );
      for (let i = 0; i < samples.length; i++) {
        channels[i % numChannels][(i / numChannels) | 0] = samples[i];
      }

      const out = new WaveFile();
      out.fromScratch(numChannels, sampleRate, '32f', channels);
      return Buffer.from(out.toBuffer());
    },
  };
}
