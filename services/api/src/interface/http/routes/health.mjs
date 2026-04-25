export function registerHealth(fastify, { llmClient, audioEnhancer, config }) {
  fastify.get('/health', async () => ({
    ok: true,
    service: 'talkToRave-api',
    llm: {
      ready: Boolean(llmClient),
      model: config.llm.model,
    },
    audio: {
      ready: Boolean(audioEnhancer),
      model: audioEnhancer ? audioEnhancer.getModelId() : null,
    },
  }));
}
