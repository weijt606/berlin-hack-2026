export function registerEnhance(fastify, { enhanceAudio }) {
  fastify.post('/enhance', async (request, reply) => {
    const out = await enhanceAudio({ wavBuffer: request.body });
    return reply.header('content-type', 'audio/wav').send(out);
  });
}
