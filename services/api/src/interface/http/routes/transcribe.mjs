export function registerTranscribe(fastify, { transcribeAudio }) {
  fastify.post('/transcribe', async (request) => {
    const compare = request.query?.compare !== '0';
    const language = request.query?.lang || undefined;
    const sessionId = request.query?.sessionId || request.headers['x-session-id'] || null;
    // Optional per-call AIC enhancement controls. Frontend sends a numeric
    // level (0-1) when the user picks a scene preset (Studio / Live House /
    // Arena / Open Air); absent → backend uses the configured default.
    const rawLevel = request.query?.level;
    const enhancementLevel =
      rawLevel === undefined || rawLevel === '' ? undefined : Number(rawLevel);
    const enhancementScene = request.query?.scene || null;
    return transcribeAudio({
      wavBuffer: request.body,
      compare,
      language,
      sessionId,
      enhancementLevel: Number.isFinite(enhancementLevel) ? enhancementLevel : undefined,
      enhancementScene,
    });
  });
}
