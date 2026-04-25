import { useEffect, useRef, useState } from 'react';
import cx from '@src/cx.mjs';
import { useSettings } from '../../../settings.mjs';

const LLM_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_LLM_URL) ||
  'http://localhost:4323';

function getStrudelMirror() {
  return typeof window !== 'undefined' ? window.strudelMirror : null;
}

// Live "update" — same path as the REPL's update button.
// scheduler.setPattern just reassigns the pattern; if already playing,
// the next cycle picks up the new pattern with no audible break.
function hotSwap(code) {
  const editor = getStrudelMirror();
  if (!editor || !code) return;
  editor.setCode(code);
  editor.evaluate(true);
}

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

const AUTO_KEY = 'strudel:vibe:autoApply';

function readAuto() {
  if (typeof window === 'undefined') return true;
  const raw = window.localStorage?.getItem(AUTO_KEY);
  return raw === null ? true : raw === 'true';
}

export function VibeTab() {
  const { fontFamily } = useSettings();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [auto, setAuto] = useState(readAuto);
  const recRef = useRef(null);
  const scrollRef = useRef(null);
  const speechSupported = Boolean(getSpeechRecognition());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem(AUTO_KEY, String(auto));
    }
  }, [auto]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => () => {
    try {
      recRef.current?.stop();
    } catch {}
  }, []);

  async function send() {
    const text = prompt.trim();
    if (!text || loading) return;
    setError('');
    setLoading(true);
    const m = getStrudelMirror();
    const currentCode = m?.code ?? '';
    const history = messages.flatMap((msg) =>
      msg.role === 'user'
        ? [{ role: 'user', text: msg.text }]
        : msg.code
          ? [{ role: 'assistant', text: msg.code }]
          : [],
    );
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setPrompt('');
    try {
      const res = await fetch(`${LLM_URL}/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: text, currentCode, history }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || `HTTP ${res.status}`);
        return;
      }
      const code = data.code || '';
      setMessages((prev) => [...prev, { role: 'assistant', code }]);
      if (auto && code) hotSwap(code);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  function toggleMic() {
    if (listening) {
      try {
        recRef.current?.stop();
      } catch {}
      return;
    }
    const SR = getSpeechRecognition();
    if (!SR) {
      setError('Voice input is not supported in this browser. Try Chrome.');
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = navigator.language || 'en-US';
    let buffer = prompt;
    rec.onresult = (event) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (final) {
        buffer = (buffer ? buffer + ' ' : '') + final.trim();
      }
      setPrompt(buffer + (interim ? (buffer ? ' ' : '') + interim : ''));
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
    };
    rec.onerror = (event) => {
      setError(`Voice input error: ${event.error || 'unknown'}`);
      setListening(false);
      recRef.current = null;
    };
    try {
      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch (err) {
      setError(`Could not start voice input: ${err.message || err}`);
    }
  }

  function reuse(code) {
    hotSwap(code);
  }

  function reset() {
    setMessages([]);
    setError('');
  }

  return (
    <div className="flex flex-col h-full w-full" style={{ fontFamily }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-muted text-xs opacity-70 shrink-0 gap-2">
        <span className="truncate">Vibe coding · iterating on the current track</span>
        <div className="flex items-center gap-2 shrink-0">
          <label
            className="flex items-center gap-1 cursor-pointer"
            title="When on, each generated edit is hot-swapped into the running pattern (update mode) — no beat break."
          >
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
            />
            auto
          </label>
          {messages.length > 0 && (
            <button
              onClick={reset}
              className="px-2 py-0.5 rounded border border-muted hover:opacity-80"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-sm opacity-60 leading-relaxed">
            Describe a track or a change. Each turn iterates on whatever is
            currently in the editor — no need to repeat what's already there.
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>"lo-fi hip-hop at 80 bpm with a soft kick and rhodes chords"</li>
              <li>"make the bass more dubby"</li>
              <li>"swap the drums for a 909 kit and double the tempo"</li>
            </ul>
          </div>
        )}

        {messages.map((msg, i) => (
          <Message key={i} msg={msg} onReuse={reuse} />
        ))}

        {loading && <div className="text-xs opacity-60">Generating…</div>}

        {error && (
          <div className="text-xs text-background bg-foreground p-2 rounded whitespace-pre-wrap break-words">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-muted p-3 space-y-2 shrink-0">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            listening
              ? 'Listening… speak now'
              : 'Describe the change. Enter to send, Shift+Enter for newline.'
          }
          className="w-full min-h-[68px] p-2 bg-background border border-muted rounded-md text-foreground resize-y focus:outline-none focus:border-foreground"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) {
              e.preventDefault();
              send();
            }
          }}
        />
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={toggleMic}
            disabled={!speechSupported}
            title={
              speechSupported
                ? 'Toggle voice input'
                : 'Voice input not supported in this browser'
            }
            className={cx(
              'px-3 py-1 rounded-md border text-sm flex items-center gap-1',
              listening
                ? 'border-foreground bg-foreground text-background animate-pulse'
                : 'border-muted text-foreground hover:opacity-80',
              !speechSupported && 'opacity-40 cursor-not-allowed',
            )}
          >
            {listening ? '● Listening' : '🎤 Voice'}
          </button>
          <button
            onClick={send}
            disabled={loading || !prompt.trim()}
            className={cx(
              'px-3 py-1 rounded-md border border-foreground text-foreground text-sm',
              (loading || !prompt.trim()) && 'opacity-50 cursor-not-allowed',
            )}
          >
            {loading ? 'Generating…' : 'Send (Enter)'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Message({ msg, onReuse }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-3 py-2 rounded-md bg-foreground text-background text-sm whitespace-pre-wrap break-words">
          {msg.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[95%] w-full border border-muted rounded-md p-2 space-y-2">
        <pre className="text-xs whitespace-pre-wrap break-words text-foreground">{msg.code}</pre>
        <div className="flex gap-2">
          <button
            onClick={() => onReuse(msg.code)}
            className="px-2 py-0.5 rounded border border-muted text-xs hover:opacity-80"
          >
            ▶ Re-run
          </button>
          <button
            onClick={() => navigator.clipboard?.writeText(msg.code)}
            className="px-2 py-0.5 rounded border border-muted text-xs hover:opacity-80"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
