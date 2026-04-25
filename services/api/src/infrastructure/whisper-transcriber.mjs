import { Whisper, manager } from 'smart-whisper';

/**
 * Lazy whisper.cpp transcriber. Downloads the model on first use (cached
 * in `~/.smart-whisper/models/`) and keeps the process-wide model alive
 * across requests. By default we set a very long idle window so the model
 * stays resident — the alternative is paying ~5 s of disk reload latency
 * whenever the user pauses for longer than the offload timeout.
 *
 * @param {{ modelName: string, gpu: boolean, language: string, offloadSecs?: number }} cfg
 * @returns {import('../application/ports.mjs').Transcriber}
 */
export function createWhisperTranscriber({ modelName, gpu, language, offloadSecs }) {
  let whisper = null;
  let loadPromise = null;

  async function ensureModel() {
    if (whisper) return whisper;
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      if (!manager.check(modelName)) {
        await manager.download(modelName);
      }
      const file = manager.resolve(modelName);
      whisper = new Whisper(file, { gpu, offload: offloadSecs ?? 86400 });
      return whisper;
    })();
    try {
      return await loadPromise;
    } finally {
      loadPromise = null;
    }
  }

  return {
    getModelId: () => modelName,
    async transcribe(pcm, opts = {}) {
      const w = await ensureModel();
      const lang = opts.language || language;
      const task = await w.transcribe(pcm, {
        language: lang === 'auto' ? 'auto' : lang,
        format: 'simple',
        no_timestamps: true,
        suppress_non_speech_tokens: true,
      });
      const segments = await task.result;
      const text = segments.map((s) => s.text).join('').trim();
      return { text };
    },
  };
}
