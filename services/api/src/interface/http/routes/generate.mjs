export function registerGenerate(fastify, { generateStrudel }) {
  fastify.post('/generate', async (request) => {
    const { prompt, currentCode, history } = request.body ?? {};
    return generateStrudel({ prompt, currentCode, history });
  });
}
