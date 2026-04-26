export function registerRecommendViz(fastify, { recommendViz }) {
  // Stateless: no session, no chat history. Frontend calls this right
  // after applying the code from /generate so the user sees the
  // visualizer switch on its own.
  fastify.post('/recommend-viz', async (request) => {
    const { code } = request.body ?? {};
    return recommendViz({ code });
  });
}
