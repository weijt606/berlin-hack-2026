import { useEffect, useRef, useState } from 'react';
import cx from '@src/cx.mjs';
import { useSettings } from '../../../settings.mjs';

const API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_API_URL) ||
  'http://localhost:4322';

const FLUSH_KEY = 'strudel:vibe:silenceFlush';
const SILENCE_MS_KEY = 'strudel:vibe:silenceMs';
const SESSION_KEY = 'strudel:vibe:sessionId';
const SILENCE_OPTIONS = [2000, 3000, 5000, 8000, 10000];
const DEFAULT_SILENCE_MS = 5000;
export const NON_PTT_CODES = new Set([
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'MetaLeft',
  'MetaRight',
  'AltLeft',
  'AltRight',
  'OSLeft',
  'OSRight',
]);

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

function readFlush() {
  if (typeof window === 'undefined') return true;
  const raw = window.localStorage?.getItem(FLUSH_KEY);
  return raw === null ? true : raw === 'true';
}

function readSilenceMs() {
  if (typeof window === 'undefined') return DEFAULT_SILENCE_MS;
  const n = Number(window.localStorage?.getItem(SILENCE_MS_KEY));
  return SILENCE_OPTIONS.includes(n) ? n : DEFAULT_SILENCE_MS;
}

function generateSessionId() {
  // Backend accepts ^[A-Za-z0-9_-]{1,64}$. Use crypto.randomUUID when
  // available, falling back to a timestamp+random combo.
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `s${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readOrCreateSessionId() {
  if (typeof window === 'undefined') return generateSessionId();
  const existing = window.localStorage?.getItem(SESSION_KEY);
  if (existing && /^[A-Za-z0-9_-]{1,64}$/.test(existing)) return existing;
  const fresh = generateSessionId();
  try {
    window.localStorage?.setItem(SESSION_KEY, fresh);
  } catch {}
  return fresh;
}

export function displayKey(code) {
  if (!code) return '—';
  if (code === 'Space') return 'Space';
  if (code === 'Backquote') return '`';
  if (code === 'Backslash') return '\\';
  if (code === 'Tab') return 'Tab';
  if (code === 'Enter') return 'Enter';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('F') && /^F\d+$/.test(code)) return code;
  if (code.startsWith('Arrow')) return code.replace('Arrow', '↕←→↓↑'.length ? code.slice(5) : code);
  return code;
}

function isTextInput(target) {
  if (!target || target.nodeType !== 1) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
  if (target.isContentEditable) return true;
  // Strudel REPL uses CodeMirror — its editor surface has role="textbox"
  if (target.getAttribute?.('role') === 'textbox') return true;
  // Walk up a few parents to catch anything inside a CM editor
  let n = target;
  for (let i = 0; i < 5 && n; i++) {
    if (n.classList?.contains('cm-content')) return true;
    n = n.parentElement;
  }
  return false;
}

export function VibeTab() {
  const { fontFamily, vibePttKey: pttKey, vibeAutoApply: auto } = useSettings();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [flush, setFlush] = useState(readFlush);
  const [silenceMs, setSilenceMs] = useState(readSilenceMs);
  const [pttHint, setPttHint] = useState(false);
  const [sessionId] = useState(readOrCreateSessionId);

  const recRef = useRef(null);
  const listeningRef = useRef(false);
  const pttActiveRef = useRef(false);
  const pttKeyDownRef = useRef(false);
  const scrollRef = useRef(null);
  const sendRef = useRef(null);
  // mirror flush + silenceMs into refs so the active recogniser closure
  // always reads the current toggle values
  const flushRef = useRef(flush);
  const silenceMsRef = useRef(silenceMs);

  const speechSupported = Boolean(getSpeechRecognition());

  useEffect(() => {
    flushRef.current = flush;
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem(FLUSH_KEY, String(flush));
    }
  }, [flush]);

  useEffect(() => {
    silenceMsRef.current = silenceMs;
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem(SILENCE_MS_KEY, String(silenceMs));
    }
  }, [silenceMs]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Hydrate the chat from the backend on mount so a refresh restores
  // the conversation. The backend treats unknown session ids as empty.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/sessions/${encodeURIComponent(sessionId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      } catch {
        // backend unreachable — fine, just start empty
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(
    () => () => {
      listeningRef.current = false;
      pttActiveRef.current = false;
      try {
        recRef.current?.stop();
      } catch {}
    },
    [],
  );

  async function send() {
    const text = prompt.trim();
    if (!text || loading) return;
    setError('');
    setLoading(true);
    const m = getStrudelMirror();
    const currentCode = m?.code ?? '';
    // Optimistic: show the user's bubble immediately. The backend
    // returns the authoritative messages array, which we adopt below.
    setMessages((prev) => [...prev, { role: 'user', text, ts: 'pending' }]);
    setPrompt('');
    try {
      const res = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, prompt: text, currentCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || `HTTP ${res.status}`);
        return;
      }
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
      const code = data.code || '';
      if (auto && code) hotSwap(code);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  // keep a ref to the latest send so global key handlers always call the
  // current closure (with current prompt / messages state)
  sendRef.current = send;

  function startMic({ ptt = false } = {}) {
    if (listeningRef.current) return;
    const SR = getSpeechRecognition();
    if (!SR) {
      setError('Voice input is not supported in this browser. Try Chrome.');
      return;
    }
    setError('');
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || 'en-US';
    let buffer = prompt;
    let silenceTimer = null;
    const clearSilence = () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
    };
    // While PTT is held, if no speech result arrives for SILENCE_MS,
    // dispatch what we have and keep the mic open for the next utterance.
    const armSilence = () => {
      clearSilence();
      if (!ptt || !flushRef.current) return;
      silenceTimer = setTimeout(() => {
        silenceTimer = null;
        if (!pttActiveRef.current) return;
        if (!buffer.trim()) return;
        sendRef.current?.();
        buffer = '';
      }, silenceMsRef.current);
    };
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
      armSilence();
    };
    rec.onend = () => {
      clearSilence();
      // If the session is still active (user hasn't released PTT or
      // clicked stop), the browser timed out — restart transparently.
      if (listeningRef.current) {
        try {
          rec.start();
          return;
        } catch {
          // fall through to cleanup
        }
      }
      const wasPtt = pttActiveRef.current;
      pttActiveRef.current = false;
      listeningRef.current = false;
      recRef.current = null;
      setListening(false);
      if (wasPtt) {
        // give the recogniser a tick to flush any final result into prompt
        setTimeout(() => {
          sendRef.current?.();
        }, 120);
      }
    };
    rec.onerror = (event) => {
      const code = event.error;
      if (code === 'no-speech' || code === 'aborted') return;
      setError(`Voice input error: ${code || 'unknown'}`);
      clearSilence();
      listeningRef.current = false;
      pttActiveRef.current = false;
    };
    try {
      rec.start();
      recRef.current = rec;
      listeningRef.current = true;
      pttActiveRef.current = ptt;
      setListening(true);
    } catch (err) {
      setError(`Could not start voice input: ${err.message || err}`);
    }
  }

  function stopMic() {
    listeningRef.current = false;
    try {
      recRef.current?.stop();
    } catch {}
  }

  // Global push-to-talk handler. Hold the configured key to record,
  // release to stop and auto-send. Skipped while focus is in any text
  // input (so Space still types a space).
  useEffect(() => {
    if (!speechSupported) return;

    function onKeyDown(e) {
      if (e.code !== pttKey) return;
      if (isTextInput(e.target)) return;
      if (e.repeat || pttKeyDownRef.current) return;
      e.preventDefault();
      pttKeyDownRef.current = true;
      setPttHint(true);
      startMic({ ptt: true });
    }

    function onKeyUp(e) {
      if (e.code !== pttKey) return;
      if (!pttKeyDownRef.current) return;
      pttKeyDownRef.current = false;
      setPttHint(false);
      if (listeningRef.current && pttActiveRef.current) {
        stopMic();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pttKey, speechSupported]);

  function reuse(code) {
    hotSwap(code);
  }

  async function reset() {
    setMessages([]);
    setError('');
    try {
      await fetch(`${API_URL}/sessions/${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  return (
    <div className="flex flex-col h-full w-full" style={{ fontFamily }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-muted text-xs opacity-70 shrink-0 gap-2">
        <span className="truncate">Vibe coding · iterating on the current track</span>
        {messages.length > 0 && (
          <button
            onClick={reset}
            className="px-2 py-0.5 rounded border border-muted hover:opacity-80 shrink-0"
          >
            Reset
          </button>
        )}
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
            <div className="mt-3 opacity-80">
              Hold <kbd className="px-1 border border-muted rounded">{displayKey(pttKey)}</kbd>{' '}
              anywhere on the page to talk, release to send.
            </div>
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
              ? pttHint
                ? `Listening… release ${displayKey(pttKey)} to send`
                : 'Listening… speak now'
              : `Describe the change. Enter to send, Shift+Enter for newline. Hold ${displayKey(
                  pttKey,
                )} for push-to-talk.`
          }
          className="w-full min-h-[68px] p-2 bg-background border border-muted rounded-md text-foreground resize-y focus:outline-none focus:border-foreground"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) {
              e.preventDefault();
              send();
            }
          }}
        />
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div
              title={
                speechSupported
                  ? `Hold ${displayKey(pttKey)} anywhere on the page to record, release to send. Change the key in Settings.`
                  : 'Voice input not supported in this browser'
              }
              className={cx(
                'px-3 py-1 rounded-md border text-sm flex items-center gap-1 select-none',
                listening
                  ? 'border-foreground bg-foreground text-background animate-pulse'
                  : 'border-muted text-foreground',
                !speechSupported && 'opacity-40',
              )}
            >
              {listening
                ? `● Recording (release ${displayKey(pttKey)})`
                : `🎤 Voice input (${displayKey(pttKey)})`}
            </div>
            <label
              className="flex items-center gap-1 cursor-pointer text-xs opacity-70"
              title={`While holding ${displayKey(pttKey)}, auto-send after the chosen pause and keep listening for the next utterance.`}
            >
              <input
                type="checkbox"
                checked={flush}
                onChange={(e) => setFlush(e.target.checked)}
              />
              auto-send after
            </label>
            <select
              value={silenceMs}
              onChange={(e) => setSilenceMs(Number(e.target.value))}
              disabled={!flush}
              title="How long of a pause counts as 'done speaking'."
              className={cx(
                'bg-background border border-muted rounded px-1 py-0.5 text-xs',
                !flush && 'opacity-50 cursor-not-allowed',
              )}
            >
              {SILENCE_OPTIONS.map((ms) => (
                <option key={ms} value={ms}>
                  {ms / 1000}s
                </option>
              ))}
            </select>
          </div>
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
