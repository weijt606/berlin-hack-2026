export function registerGenerate(fastify, { generateStrudel }) {
  fastify.post('/generate', async (request) => {
    const { prompt, currentCode } = request.body ?? {};
    return generateStrudel({ prompt, currentCode });
  });
}
