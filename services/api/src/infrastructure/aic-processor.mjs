import { mkdirSync } from 'node:fs';
import wavefile from 'wavefile';
import { Model, Processor } from '@ai-coustics/aic-sdk';

const { WaveFile } = wavefile;

/**
 * Returns an AudioEnhancer implementation, or `null` if no license is configured.
 * Downloads the model on construction (first call only — the SDK caches by id).
 *
 * @param {{ licenseKey: string | null, modelId: string, modelsDir: string }} cfg
 * @returns {import('../application/ports.mjs').AudioEnhancer | null}
 */
export function createAicProcessor({ licenseKey, modelId, modelsDir }) {
  if (!licenseKey) return null;

  mkdirSync(modelsDir, { recursive: true });
  const modelPath = Model.download(modelId, modelsDir);
  const model = Model.fromFile(modelPath);

  return {
    getModelId: () => model.getId(),
    async enhance(wavBuffer) {
      const wav = new WaveFile(wavBuffer);
      wav.toBitDepth('32f');

      const sampleRate = wav.fmt.sampleRate;
      const numChannels = wav.fmt.numChannels;
      const numFrames = model.getOptimalNumFrames(sampleRate);
      const samples = wav.getSamples(true, Float32Array);

      const processor = new Processor(model, licenseKey);
      processor.initialize(sampleRate, numChannels, numFrames, false);

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
