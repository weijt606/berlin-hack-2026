export function registerGenerate(fastify, { chatSession }) {
  fastify.post('/generate', async (request) => {
    const { sessionId, prompt, currentCode } = request.body ?? {};
    return chatSession.sendTurn({ sessionId, prompt, currentCode });
  });
}
