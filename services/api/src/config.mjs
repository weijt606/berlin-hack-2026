function clampUnit(raw, fallback) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

export function loadConfig() {
  // LLM_PROVIDER picks which backend the composition root wires.
  // Valid: 'gemini' (default, cloud) | 'ollama' (local daemon).
  const provider = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();

  return {
    server: {
      port: Number(process.env.API_PORT || 4322),
      host: process.env.API_HOST || '0.0.0.0',
      maxBodyBytes: Number(process.env.API_MAX_BYTES || 50 * 1024 * 1024),
    },
    llm: {
      provider,
      gemini: {
        apiKey: process.env.GEMINI_API_KEY ?? null,
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        // 0.85 instead of the more common 0.7 default — for live-coding music
        // we actively WANT the model to spread across drum kits, scales, and
        // visualizers rather than collapse onto its single highest-likelihood
        // "lo-fi LinnDrum + Rhodes" template every time. Combined with
        // skills/strudel/rules/diversity.md this gives noticeably more varied
        // output. Override via GEMINI_TEMPERATURE if a particular voice needs
        // it dialled back.
        temperature: Number.isFinite(Number(process.env.GEMINI_TEMPERATURE))
          ? Number(process.env.GEMINI_TEMPERATURE)
          : 0.85,
      },
      ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'qwen2.5:14b',
        // num_ctx — Ollama default is 2K which truncates our ~16K-token skill
        // prompt into uselessness. Bump to fit the assembled skill plus headroom.
        numCtx: Number(process.env.OLLAMA_NUM_CTX || 32768),
        // Thinking-capable models (qwen3:*) emit chain-of-thought before any
        // answer — fine for research chat, useless for live-coding loops where
        // we want sub-second code drops.
        think: /^(1|true|yes|on)$/i.test(process.env.OLLAMA_THINK || ''),
      },
    },
    audio: {
      licenseKey: process.env.AIC_SDK_LICENSE ?? null,
      modelId: process.env.AIC_MODEL_ID || 'quail-vf-2.1-l-16khz',
      // Per ai-coustics docs (/guides/speech-enhancement-for-asr): 0.5 is
      // the SDK default. Studio-clean speech can get over-suppressed at
      // higher levels (consonants thin out, English STT degrades). Crank
      // to 0.8 in .env for noisy rave / live-stage demos where aggressive
      // denoise pays off.
      enhancementLevel: clampUnit(process.env.AIC_ENHANCEMENT_LEVEL, 0.5),
    },
    stt: {
      // STT_PROVIDER picks which transcriber the composition root wires:
      //   whisper → local smart-whisper (default, no network, ~700-900ms)
      //   gemini  → Gemini multimodal API (~1-2s, much better on short
      //             commands; uses the same GEMINI_API_KEY as code-gen)
      provider: (process.env.STT_PROVIDER || 'whisper').toLowerCase(),
      modelName: process.env.WHISPER_MODEL || 'base.en',
      gpu: process.env.WHISPER_GPU !== '0',
      language: process.env.WHISPER_LANGUAGE || 'auto',
      // smart-whisper offloads the model after this many seconds idle.
      // Default ~1 day = effectively resident; set to a small number
      // to free RAM aggressively, or 300 to match the SDK default.
      offloadSecs: Number(process.env.WHISPER_OFFLOAD_SECS || 86400),
      // Optional override for the DJ vocab biasing prompt fed to the
      // decoder as `initial_prompt`. When unset, whisper-transcriber.mjs
      // uses its built-in DJ/Strudel vocab.
      initialPrompt: process.env.WHISPER_INITIAL_PROMPT || null,
      // Gemini STT model. gemini-2.5-flash has the broadest free-tier
      // quota and lands transcripts in ~2s warm with state-of-the-art
      // accuracy on short DJ commands (verified 2026-04-26 against the
      // demo phrase list). Override per env if a newer model is needed.
      geminiModel: process.env.GEMINI_STT_MODEL || 'gemini-2.5-flash',
    },
    sessions: {
      dir: process.env.API_SESSIONS_DIR || null,
    },
    dump: {
      // Writes raw.wav / enhanced.wav / raw.txt / enhanced.txt / final.txt /
      // meta.json per voice take so we can A/B the AIC enhancer and diff
      // transcripts offline. ON by default for hackathon analysis; set
      // API_DUMP_STAGES=0 to disable. Recordings are PII and disk grows
      // fast — purge data/stage-dumps/ before sharing the box.
      stages: !/^(0|false|no|off)$/i.test(process.env.API_DUMP_STAGES || ''),
      dir: process.env.API_DUMP_DIR || null,
    },
    transcript: {
      // LLM cleanup pass after Whisper. Catches recognition errors the static
      // dictionary in whisper-transcriber can't (artist names, half-heard
      // phrases, fillers). Default ON; set LLM_CORRECT_TRANSCRIPT=false to
      // disable (saves one Gemini call per voice prompt).
      //
      // Hackathon demo note: we ran with this OFF on demo day. Stage-dump
      // audit showed the normalizer's wins (e.g. "Hall's music" → "House
      // music") were mostly handled downstream by the code-gen Gemini
      // anyway, while its failure modes — proper-noun fabrication
      // ("Ben Thede" → "Ben Benda", "Elite phase" → "Aliased phase") and
      // a 500-2000ms tail on the hot path — hurt live use. The static
      // post-process dict stays on either way. Flip back to true for
      // offline WER experiments.
      llmCorrect: !/^(0|false|no|off)$/i.test(process.env.LLM_CORRECT_TRANSCRIPT || ''),
    },
    pioneer: {
      // Pioneer-trained GLiNER2 classifier for per-track viz selection.
      // When unset the /recommend-viz endpoint returns 503 and the frontend
      // falls back to the user's existing viz choice.
      apiKey: process.env.PIONEER_API_KEY ?? null,
      vizModelId: process.env.PIONEER_VIZ_MODEL_ID ?? null,
    },
  };
}
