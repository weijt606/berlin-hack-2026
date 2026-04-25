import { useState } from 'react';
import cx from '@src/cx.mjs';
import { useSettings } from '../../../settings.mjs';

const LLM_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_LLM_URL) ||
  'http://localhost:4323';

export function AITab() {
  const { fontFamily } = useSettings();
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useCurrent, setUseCurrent] = useState(false);

  async function generate() {
    setError('');
    setLoading(true);
    try {
      const body = { prompt };
      if (useCurrent && typeof window !== 'undefined' && window.strudelMirror) {
        body.currentCode = window.strudelMirror.code ?? '';
      }
      const res = await fetch(`${LLM_URL}/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || `HTTP ${res.status}`);
        return;
      }
      setCode(data.code || '');
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  function injectAndPlay() {
    if (!code || typeof window === 'undefined') return;
    const m = window.strudelMirror;
    if (!m) {
      setError('Strudel editor not ready yet.');
      return;
    }
    m.setCode(code);
    m.evaluate();
  }

  function injectOnly() {
    if (!code || typeof window === 'undefined') return;
    const m = window.strudelMirror;
    if (!m) {
      setError('Strudel editor not ready yet.');
      return;
    }
    m.setCode(code);
  }

  return (
    <div className="flex flex-col h-full w-full p-3 space-y-3 overflow-auto" style={{ fontFamily }}>
      <div className="text-xs opacity-70">
        Describe a track and Gemini will write Strudel code. Service: <code>{LLM_URL}</code>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. lo-fi beat at 80 bpm with rhodes chords and a soft kick"
        className="w-full min-h-[80px] p-2 bg-background border border-muted rounded-md text-foreground resize-y focus:outline-none focus:border-foreground"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            generate();
          }
        }}
      />

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="flex items-center gap-2 text-xs opacity-80 cursor-pointer">
          <input
            type="checkbox"
            checked={useCurrent}
            onChange={(e) => setUseCurrent(e.target.checked)}
          />
          Modify current track
        </label>
        <button
          onClick={generate}
          disabled={loading || !prompt.trim()}
          className={cx(
            'px-3 py-1 rounded-md border border-foreground text-foreground text-sm',
            (loading || !prompt.trim()) && 'opacity-50 cursor-not-allowed',
          )}
        >
          {loading ? 'Generating…' : 'Generate (⌘+Enter)'}
        </button>
      </div>

      {error && (
        <div className="text-sm text-background bg-foreground p-2 rounded-md whitespace-pre-wrap break-words">
          {error}
        </div>
      )}

      {code && (
        <div className="flex flex-col gap-2 border border-muted rounded-md p-2">
          <pre className="text-xs whitespace-pre-wrap break-words text-foreground">{code}</pre>
          <div className="flex gap-2">
            <button
              onClick={injectAndPlay}
              className="px-3 py-1 rounded-md border border-foreground text-foreground text-sm hover:opacity-80"
            >
              ▶ Inject & Play
            </button>
            <button
              onClick={injectOnly}
              className="px-3 py-1 rounded-md border border-muted text-foreground text-sm hover:opacity-80"
            >
              Inject only
            </button>
            <button
              onClick={() => navigator.clipboard?.writeText(code)}
              className="px-3 py-1 rounded-md border border-muted text-foreground text-sm hover:opacity-80"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
