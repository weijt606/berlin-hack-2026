function clampUnit(raw, fallback) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

export function loadConfig() {
  // LLM_PROVIDER picks which backend to wire in the composition root.
  // Valid values: 'gemini' (default) | 'ollama'.
  const provider = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();
  // STT_PROVIDER picks which speech-to-text backend the voice-prompt path
  // uses. 'gemini' = cloud, fast-ish, quota-bound. 'whisper' = local
  // whisper.cpp via nodejs-whisper, fully offline, no quota.
  const sttProvider = (process.env.STT_PROVIDER || 'gemini').toLowerCase();

  return {
    server: {
      port: Number(process.env.API_PORT || 4322),
      host: process.env.API_HOST || '0.0.0.0',
      maxBodyBytes: Number(process.env.API_MAX_BYTES || 50 * 1024 * 1024),
    },
    stt: {
      provider: sttProvider,
      whisper: {
        // base.en   = 142 MB,  fastest, EN-only, ~300ms latency on M-series
        //   — but its accuracy on technical jargon ("rhodes", "lo-fi", BPM
        //   numbers) is borderline; we default to small.en for the demo.
        // small.en  = 466 MB,  balanced, EN-only, ~600ms
        // medium.en = 1.5 GB,  most accurate EN-only
        // large-v3-turbo = 1.6 GB, multilingual incl. CN, ~1s
        modelName: process.env.WHISPER_MODEL || 'small.en',
        // Keep model files outside node_modules so a clean reinstall doesn't
        // re-download a 140MB+ blob.
        modelRootPath: process.env.WHISPER_MODEL_ROOT || null, // resolved later in index.mjs
        // Optional override for the initial-prompt vocabulary biasing. When
        // empty/unset, whisper-stt.mjs uses its built-in DJ/Strudel vocab.
        initialPrompt: process.env.WHISPER_INITIAL_PROMPT || null,
      },
    },
    llm: {
      provider,
      gemini: {
        apiKey: process.env.GEMINI_API_KEY ?? null,
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        // STT defaults to whatever GEMINI_MODEL is set to (one quota pool to
        // worry about, easy single-knob config). Override with GEMINI_STT_MODEL
        // when you specifically need a different model for audio — e.g.,
        // 'gemini-flash-latest' is more accurate at audio than *-lite-preview
        // variants, BUT it lives in a different quota pool so might 429
        // independently.
        sttModel: process.env.GEMINI_STT_MODEL
          || process.env.GEMINI_MODEL
          || 'gemini-2.5-flash',
      },
      ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'qwen2.5:14b',
        // num_ctx — Ollama default is 2K which truncates our ~16K-token skill
        // prompt into uselessness. Bump to fit the assembled skill plus headroom.
        numCtx: Number(process.env.OLLAMA_NUM_CTX || 32768),
        // Thinking-capable models (qwen3:*, etc.) emit chain-of-thought tokens
        // before the answer. We want fast code drops, not reasoning traces.
        think: /^(1|true|yes|on)$/i.test(process.env.OLLAMA_THINK || ''),
      },
    },
    audio: {
      licenseKey: process.env.AIC_SDK_LICENSE ?? null,
      modelId: process.env.AIC_MODEL_ID || 'quail-vf-2.1-l-16khz',
      // Per ai-coustics docs (/guides/speech-enhancement-for-asr): 0.5 is the
      // SDK default. We default to 0.5 so clean studio speech doesn't get
      // over-suppressed (which was eating English consonants and tanking
      // STT accuracy). Crank to 0.8 in .env for noisy rave / live-stage
      // demos where aggressive denoise pays off.
      enhancementLevel: clampUnit(process.env.AIC_ENHANCEMENT_LEVEL, 0.5),
    },
    sessions: {
      dir: process.env.API_SESSIONS_DIR || null,
    },
  };
}
