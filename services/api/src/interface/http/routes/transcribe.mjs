export function registerTranscribe(fastify, { transcribeAudio }) {
  fastify.post('/transcribe', async (request) => {
    const compare = request.query?.compare !== '0';
    const language = request.query?.lang || undefined;
    const sessionId = request.query?.sessionId || request.headers['x-session-id'] || null;
    return transcribeAudio({
      wavBuffer: request.body,
      compare,
      language,
      sessionId,
    });
  });
}
