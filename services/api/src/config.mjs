export function loadConfig() {
  return {
    server: {
      port: Number(process.env.API_PORT || 4322),
      host: process.env.API_HOST || '0.0.0.0',
      maxBodyBytes: Number(process.env.API_MAX_BYTES || 50 * 1024 * 1024),
    },
    llm: {
      apiKey: process.env.GEMINI_API_KEY ?? null,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    },
    audio: {
      licenseKey: process.env.AIC_SDK_LICENSE ?? null,
      modelId: process.env.AIC_MODEL_ID || 'quail-vf-2.1-l-16khz',
    },
    stt: {
      modelName: process.env.WHISPER_MODEL || 'base.en',
      gpu: process.env.WHISPER_GPU !== '0',
      language: process.env.WHISPER_LANGUAGE || 'auto',
      // smart-whisper offloads the model after this many seconds idle.
      // Default ~1 day = effectively resident; set to a small number
      // to free RAM aggressively, or 300 to match the SDK default.
      offloadSecs: Number(process.env.WHISPER_OFFLOAD_SECS || 86400),
    },
    sessions: {
      dir: process.env.API_SESSIONS_DIR || null,
    },
  };
}
