export function loadConfig() {
  // LLM_PROVIDER picks which backend to wire in the composition root.
  // Valid values: 'gemini' (default) | 'ollama'.
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
    },
    sessions: {
      dir: process.env.API_SESSIONS_DIR || null,
    },
  };
}
