export const API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_API_URL) ||
  'http://localhost:4322';

export async function fetchSessionMessages(sessionId) {
  const res = await fetch(`${API_URL}/sessions/${encodeURIComponent(sessionId)}`);
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  return Array.isArray(data.messages) ? data.messages : [];
}

// `signal` (AbortSignal) lets callers cancel an in-flight request — the
// VibeTab uses this to abort slow LLM calls without leaking handlers.
export async function postGenerate({ sessionId, prompt, currentCode, signal }) {
  const res = await fetch(`${API_URL}/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId, prompt, currentCode }),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.data = data;
    throw err;
  }
  return data;
}

// `lang` is the speech-recognition language hint (e.g. 'en-US'). Omit or
// pass 'auto' to let the backend fall back to its default detection.
// `aicLevel` (0-1) overrides the server's AIC enhancement level for this
// take; `aicScene` is the scene id used to pick the level (logged for
// later A/B). Omit either to let the backend use its env default.
export async function postTranscribe({ sessionId, wavBlob, lang, aicLevel, aicScene }) {
  const params = new URLSearchParams({ sessionId });
  if (lang && lang !== 'auto') params.set('lang', lang);
  if (typeof aicLevel === 'number' && Number.isFinite(aicLevel)) {
    params.set('level', String(aicLevel));
  }
  if (aicScene) params.set('scene', aicScene);
  const url = `${API_URL}/transcribe?${params.toString()}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'audio/wav' },
    body: wavBlob,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || `Transcribe failed: HTTP ${res.status}`);
    err.data = data;
    throw err;
  }
  return data;
}

export async function deleteSession(sessionId) {
  await fetch(`${API_URL}/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
}

// Stateless second hop after /generate: ship the just-applied code to
// the Pioneer GLiNER2 classifier and get back which painter to use
// (`{ viz, model, latencyMs }`). The frontend shows a "Pioneer picking
// viz…" badge while this is in flight. Returns `{ viz: null }` (or
// null on network failure) — caller falls back to the user's current pick.
export async function postRecommendViz({ code, signal }) {
  const res = await fetch(`${API_URL}/recommend-viz`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code }),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.data = data;
    throw err;
  }
  return data;
}

// Stateless one-shot fix: no session history, no chat-log mutation. Used
// when the in-browser scheduler emits runtime errors (sound not loaded,
// NaN AudioParam, wrong-typed control) — we ship the failing code + first
// error back and apply whatever the model returns.
export async function postGenerateFix({ currentCode, error, signal }) {
  const res = await fetch(`${API_URL}/generate/fix`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ currentCode, error }),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.data = data;
    throw err;
  }
  return data;
}
