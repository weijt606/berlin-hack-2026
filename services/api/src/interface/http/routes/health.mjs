export function registerHealth(fastify, { llmClient, audioEnhancer, config }) {
  fastify.get('/health', async () => {
    const provider = config.llm.provider;
    const model = provider === 'ollama'
      ? config.llm.ollama.model
      : config.llm.gemini.model;
    return {
      ok: true,
      service: 'vibe-rave-api',
      llm: {
        ready: Boolean(llmClient),
        provider,
        model,
      },
      audio: {
        ready: Boolean(audioEnhancer),
        model: audioEnhancer ? audioEnhancer.getModelId() : null,
      },
    };
  });
}
