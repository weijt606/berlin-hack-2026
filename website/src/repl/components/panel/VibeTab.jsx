import { useEffect, useRef, useState } from 'react';
import cx from '@src/cx.mjs';
import { useSettings } from '../../../settings.mjs';
import { createVoiceRecorder } from './voice-recorder.mjs';

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
  const [transcribing, setTranscribing] = useState(false);
  const [flush, setFlush] = useState(readFlush);
  const [silenceMs, setSilenceMs] = useState(readSilenceMs);
  const [pttHint, setPttHint] = useState(false);
  const [sessionId] = useState(readOrCreateSessionId);

  const recorderRef = useRef(null);
  const pttActiveRef = useRef(false);
  const pttKeyDownRef = useRef(false);
  const scrollRef = useRef(null);
  const sendRef = useRef(null);
  // mirror flush + silenceMs into refs so the active recorder closure
  // always reads the current toggle values
  const flushRef = useRef(flush);
  const silenceMsRef = useRef(silenceMs);
  // Rolling buffer of recent input RMS values used to draw the live
  // waveform. The recorder fires onLevel ~85 times/sec; we mutate this
  // ref directly (cheap) and a requestAnimationFrame loop copies the
  // snapshot into React state at ~30 fps so the bars actually animate.
  const WAVEFORM_BARS = 18;
  const levelBufferRef = useRef(new Array(WAVEFORM_BARS).fill(0));
  const [waveform, setWaveform] = useState(() => new Array(WAVEFORM_BARS).fill(0));

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

  // Pump the waveform from the level-buffer ref into React state at ~30 fps
  // while we're listening. Reset the buffer back to zero on stop so the bars
  // don't freeze at their last height.
  useEffect(() => {
    if (!listening) {
      levelBufferRef.current = new Array(WAVEFORM_BARS).fill(0);
      setWaveform(new Array(WAVEFORM_BARS).fill(0));
      return;
    }
    let raf = 0;
    let last = 0;
    const tick = (t) => {
      if (t - last > 33) {
        last = t;
        setWaveform([...levelBufferRef.current]);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [listening]);

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
      pttActiveRef.current = false;
      const r = recorderRef.current;
      recorderRef.current = null;
      r?.stop().catch(() => {});
    },
    [],
  );

  async function send(textOverride) {
    const text = (textOverride ?? prompt).trim();
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

  // Pull current settings off refs at recorder-construction time so the
  // closure inside onSilence sees the latest values without needing
  // useEffect to rebuild the recorder on every change.
  function startRecording({ ptt = false } = {}) {
    if (recorderRef.current) return;
    setError('');
    const recorder = createVoiceRecorder({
      silenceMs: ptt && flushRef.current ? silenceMsRef.current : 0,
      onSilence: handleSilenceFlush,
      onLevel: (rms) => {
        const buf = levelBufferRef.current;
        // shift left, append latest — same shape, mutated in place
        for (let i = 0; i < buf.length - 1; i++) buf[i] = buf[i + 1];
        buf[buf.length - 1] = rms;
      },
    });
    recorder
      .start()
      .then(() => {
        recorderRef.current = recorder;
        pttActiveRef.current = ptt;
        setListening(true);
      })
      .catch((err) => {
        setError(`Could not start recording: ${err?.message || err}`);
      });
  }

  // Triggered by the recorder when no voice has been heard for the
  // configured silence window. Flushes the current take and — if the
  // user is still holding PTT — starts a new one for the next utterance.
  async function handleSilenceFlush() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorderRef.current = null;
    setListening(false);
    let blob = null;
    try {
      blob = await recorder.stop();
    } catch (err) {
      setError(`Recording failed: ${err?.message || err}`);
    }
    if (pttKeyDownRef.current) {
      // continue listening seamlessly while we transcribe in the background
      startRecording({ ptt: true });
    }
    if (blob) transcribeAndSend(blob);
  }

  async function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorderRef.current = null;
    setListening(false);
    const wasPtt = pttActiveRef.current;
    pttActiveRef.current = false;
    let blob = null;
    try {
      blob = await recorder.stop();
    } catch (err) {
      setError(`Recording failed: ${err?.message || err}`);
      return;
    }
    if (blob && wasPtt) transcribeAndSend(blob);
  }

  async function transcribeAndSend(wavBlob) {
    if (!wavBlob || wavBlob.size < 2048) return; // skip empty / too-short takes
    setTranscribing(true);
    try {
      const url = `${API_URL}/transcribe?sessionId=${encodeURIComponent(sessionId)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'audio/wav' },
        body: wavBlob,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `Transcribe failed: HTTP ${res.status}`);
        return;
      }
      const text = (data.text || '').trim();
      if (!text) return;
      setPrompt(text);
      await send(text);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setTranscribing(false);
    }
  }

  // Global push-to-talk handler. Hold the configured key to record,
  // release to stop and auto-send. Skipped while focus is in any text
  // input (so Space still types a space).
  useEffect(() => {
    function onKeyDown(e) {
      if (e.code !== pttKey) return;
      if (isTextInput(e.target)) return;
      if (e.repeat || pttKeyDownRef.current) return;
      e.preventDefault();
      pttKeyDownRef.current = true;
      setPttHint(true);
      startRecording({ ptt: true });
    }

    function onKeyUp(e) {
      if (e.code !== pttKey) return;
      if (!pttKeyDownRef.current) return;
      pttKeyDownRef.current = false;
      setPttHint(false);
      if (recorderRef.current && pttActiveRef.current) {
        stopRecording();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pttKey]);

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

        {transcribing && <div className="text-xs opacity-60">Transcribing…</div>}
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
                ? `Recording… release ${displayKey(pttKey)} to send`
                : 'Recording… speak now'
              : transcribing
                ? 'Transcribing…'
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
              title={`Hold ${displayKey(pttKey)} anywhere on the page to record, release to send. Change the key in Settings.`}
              className={cx(
                'px-3 py-1 rounded-md border text-sm flex items-center gap-2 select-none',
                listening
                  ? 'border-foreground bg-foreground text-background'
                  : transcribing
                    ? 'border-foreground text-foreground opacity-70'
                    : 'border-muted text-foreground',
              )}
            >
              {listening ? (
                <>
                  <Waveform levels={waveform} />
                  <span className="tabular-nums">release {displayKey(pttKey)}</span>
                </>
              ) : transcribing ? (
                '… Transcribing'
              ) : (
                `🎤 Voice input (${displayKey(pttKey)})`
              )}
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
            onClick={() => send()}
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

function Waveform({ levels }) {
  // Each bar's height comes from a recent RMS sample. We map a linear RMS
  // 0..1 onto a min-floor-of-15% for visual presence and clamp to 100%.
  // The multiplier (~700) is empirically what makes normal speech fill
  // roughly 60-90% of the bar height without clipping on shouts.
  return (
    <span className="flex items-end gap-px h-3 w-[42px]" aria-hidden>
      {levels.map((rms, i) => {
        const h = Math.max(15, Math.min(100, rms * 700));
        return (
          <span
            key={i}
            className="w-0.5 bg-background rounded-sm transition-all duration-75"
            style={{ height: `${h}%` }}
          />
        );
      })}
    </span>
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
