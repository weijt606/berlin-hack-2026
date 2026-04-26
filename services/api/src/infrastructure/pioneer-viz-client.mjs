// Calls a Pioneer-trained GLiNER2 classifier to pick the per-track
// visualization from the Strudel code. Replaces the old "// viz: ..."
// hint that the main LLM used to emit — see generate-strudel.mjs and
// skills/strudel/rules/output-format.md.
//
// Returns null on any failure (missing key, network, bad shape) so the
// UI can fall back to whatever the user already has selected. The route
// layer is responsible for translating null into a sensible default.

const PIONEER_INFERENCE_URL = 'https://api.pioneer.ai/inference';
const ALLOWED_VIZ = ['pianoroll', 'waveform', 'spectrum', 'scope', 'spiral'];
// Hard ceiling so a stuck Pioneer call can't keep the UI in
// "推荐中..." indefinitely; the frontend already shows a loading badge
// during this window.
const DEFAULT_TIMEOUT_MS = 8000;

/**
 * @param {{ apiKey: string | null, modelId: string | null, timeoutMs?: number }} cfg
 * @returns {{ recommend: (code: string) => Promise<{ viz: string | null, model: string | null, latencyMs: number }> } | null}
 */
export function createPioneerVizClient({ apiKey, modelId, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  if (!apiKey || !modelId) return null;

  return {
    async recommend(code) {
      if (typeof code !== 'string' || code.trim() === '') {
        return { viz: null, model: modelId, latencyMs: 0 };
      }
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const startedAt = Date.now();
      try {
        const res = await fetch(PIONEER_INFERENCE_URL, {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model_id: modelId,
            text: code,
            schema: {
              classifications: [{ task: 'viz', labels: ALLOWED_VIZ }],
            },
          }),
          signal: ctrl.signal,
        });
        const latencyMs = Date.now() - startedAt;
        if (!res.ok) return { viz: null, model: modelId, latencyMs };
        const data = await res.json().catch(() => null);
        const raw = data?.result?.viz;
        const viz = typeof raw === 'string' && ALLOWED_VIZ.includes(raw) ? raw : null;
        return { viz, model: modelId, latencyMs };
      } catch {
        return { viz: null, model: modelId, latencyMs: Date.now() - startedAt };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
