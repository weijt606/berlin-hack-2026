export const API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_API_URL) ||
  'http://localhost:4322';

export async function fetchSessionMessages(sessionId) {
  const res = await fetch(`${API_URL}/sessions/${encodeURIComponent(sessionId)}`);
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  return Array.isArray(data.messages) ? data.messages : [];
}

export async function postGenerate({ sessionId, prompt, currentCode }) {
  const res = await fetch(`${API_URL}/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId, prompt, currentCode }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.data = data;
    throw err;
  }
  return data;
}

export async function postTranscribe({ sessionId, wavBlob }) {
  const url = `${API_URL}/transcribe?sessionId=${encodeURIComponent(sessionId)}`;
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
