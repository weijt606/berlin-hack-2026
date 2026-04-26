import { InvalidInput, ServiceUnavailable } from '../domain/errors.mjs';

/**
 * Two-step viz recommendation: the main /generate call returns code only,
 * the frontend then POSTs that code here to pick a painter via the
 * Pioneer-trained classifier. Kept stateless on purpose — we don't want
 * the recommendation to depend on chat history, only the final code.
 *
 * @param {{ pioneerVizClient: ReturnType<typeof import('../infrastructure/pioneer-viz-client.mjs').createPioneerVizClient> | null }} deps
 */
export function makeRecommendViz({ pioneerVizClient }) {
  return async function recommendViz({ code }) {
    if (typeof code !== 'string' || code.trim() === '') {
      throw new InvalidInput('Body must include a non-empty string `code` field.');
    }
    if (!pioneerVizClient) {
      throw new ServiceUnavailable(
        'PIONEER_API_KEY / PIONEER_VIZ_MODEL_ID is not set in the .env file.',
      );
    }
    const { viz, model, latencyMs } = await pioneerVizClient.recommend(code);
    return { viz, model, latencyMs };
  };
}
