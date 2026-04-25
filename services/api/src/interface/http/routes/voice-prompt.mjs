export function registerVoicePrompt(fastify, { voicePrompt }) {
  fastify.post('/voice-prompt', async (request) => {
    const languageHint = typeof request.query?.lang === 'string' ? request.query.lang : null;
    return voicePrompt({ wavBuffer: request.body, languageHint });
  });
}
