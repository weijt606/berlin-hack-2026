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
//
// IMPORTANT for live coding: never call .stop() / .repl.stop() / .repl.pause()
// here. The user's complaint "music stops on every input" was traced to
// hotSwap firing while the new pattern had a runtime error — the scheduler
// kept its empty/broken pattern slot and the user heard silence. Awaiting
// evaluate and surfacing the error preserves the previous pattern in that
// case (Strudel's evaluate path doesn't touch the scheduler.pattern slot
// when compilation throws), so audio continues playing whatever was last
// good.
async function hotSwap(code, onError) {
  const editor = getStrudelMirror();
  if (!editor || !code) return;
  editor.setCode(code);
  try {
    await editor.evaluate(true);
  } catch (err) {
    const msg = err?.message || String(err);
    console.error('[vibe] hotSwap eval failed:', msg);
    onError?.(`Code didn't run: ${msg}`);
  }
}

// We no longer use Web Speech API (it bypassed ai-coustics — the whole point
// of the project track is enhancing noisy stage audio before STT). The voice
// path is now: mic → ScriptProcessor float32 capture → 16kHz mono WAV →
// POST /voice-prompt → ai-coustics enhance → Gemini STT → transcript.
function hasMicSupport() {
  return typeof window !== 'undefined' && !!navigator?.mediaDevices?.getUserMedia;
}

// --- WAV / resampling helpers (no external dep) ---
function mergeFloat32(chunks) {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Float32Array(total);
  let offset = 0;
  for (const c of chunks) { out.set(c, offset); offset += c.length; }
  return out;
}

async function resampleTo16k(input, inputRate) {
  if (inputRate === 16000) return input;
  // OfflineAudioContext gives us a proper polyphase resampler with
  // anti-aliasing built in — orders of magnitude better than the previous
  // nearest-neighbour pick, which introduced aliasing that confused both
  // ai-coustics and Gemini's STT (manifested as "the model hears garbled
  // hissy English" → wrong transcripts).
  const targetRate = 16000;
  const outLength = Math.floor(input.length * (targetRate / inputRate));
  const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
    1,
    outLength,
    targetRate,
  );
  const buf = offlineCtx.createBuffer(1, input.length, inputRate);
  buf.getChannelData(0).set(input);
  const src = offlineCtx.createBufferSource();
  src.buffer = buf;
  src.connect(offlineCtx.destination);
  src.start();
  const rendered = await offlineCtx.startRendering();
  return rendered.getChannelData(0);
}

function encodeWavMono16k(samples) {
  const sampleRate = 16000;
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  let offset = 0;
  const ws = (s) => { for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i)); };
  const u32 = (v) => { view.setUint32(offset, v, true); offset += 4; };
  const u16 = (v) => { view.setUint16(offset, v, true); offset += 2; };
  ws('RIFF'); u32(36 + dataSize); ws('WAVE');
  ws('fmt '); u32(16); u16(1); u16(1); u32(sampleRate);
  u32(sampleRate * 1 * bytesPerSample); u16(1 * bytesPerSample); u16(16);
  ws('data'); u32(dataSize);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: 'audio/wav' });
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
  const { fontFamily, vibePttKey: pttKey, vibeAutoApply: auto, vibeVoiceLang } = useSettings();
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
  // AbortController for the in-flight /generate fetch, so the user can cancel
  // a long-running LLM call (esp. local Ollama with cold prefill) and re-input.
  const abortRef = useRef(null);
  // mirror flush + silenceMs into refs so the active recogniser closure
  // always reads the current toggle values
  const flushRef = useRef(flush);
  const silenceMsRef = useRef(silenceMs);

  const speechSupported = hasMicSupport();
  // 'idle' | 'recording' | 'processing'
  const [voiceStage, setVoiceStage] = useState('idle');
  // Last STT transcript — pinned in the UI so it stays visible even after
  // the textarea is cleared by send(). Cleared on next recording.
  const [lastTranscript, setLastTranscript] = useState('');
  // Pending auto-send timer ref. We let the user *cancel* the auto-send by
  // typing in the textarea (handled in textarea onChange).
  const autoSendTimerRef = useRef(null);

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
    // Clear input now so the DJ can start typing the next prompt while this
    // one is in flight (or after cancel without having to wipe stale text).
    setPrompt('');
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, prompt: text, currentCode }),
        signal: ctrl.signal,
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
      if (auto && code) hotSwap(code, setError);
    } catch (err) {
      if (err?.name === 'AbortError') {
        // user cancelled — drop the optimistic bubble; input is already empty
        setMessages((prev) => prev.filter((msg) => msg.ts !== 'pending'));
      } else {
        setError(err.message || String(err));
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }

  function cancelSend() {
    abortRef.current?.abort();
  }

  // keep a ref to the latest send so global key handlers always call the
  // current closure (with current prompt / messages state)
  sendRef.current = send;

  // New voice path: capture raw mic audio, encode WAV, post to /voice-prompt
  // (server runs ai-coustics enhance + Gemini STT), then drop the transcript
  // into the prompt. Replaces the old Web Speech API path entirely — that
  // bypassed ai-coustics, which is the whole point of this hackathon track.
  async function startMic({ ptt = false } = {}) {
    if (listeningRef.current) return;
    if (!hasMicSupport()) {
      setError('Microphone capture is not available in this browser.');
      return;
    }
    setError('');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          // Keep AGC on so quiet voice still has reasonable level for both
          // ai-coustics and Gemini STT — disabling it killed accuracy on
          // soft speakers. Browser noise suppression / echo cancel stay OFF
          // so ai-coustics gets the raw broadband noise to actually denoise
          // (its whole reason for existing).
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });
    } catch (err) {
      setError(`Microphone access denied: ${err.message || err}`);
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();
    const source = audioCtx.createMediaStreamSource(stream);
    // ScriptProcessorNode is deprecated but works everywhere; AudioWorklet
    // would need a separate file in /public, not worth it for a 50-line hack.
    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    const chunks = [];
    processor.onaudioprocess = (e) => {
      const ch = e.inputBuffer.getChannelData(0);
      // copy: the buffer is reused between callbacks
      chunks.push(new Float32Array(ch));
    };
    source.connect(processor);
    // ScriptProcessor needs a sink to actually fire; route to a muted gain so
    // the user doesn't hear feedback.
    const sink = audioCtx.createGain();
    sink.gain.value = 0;
    processor.connect(sink);
    sink.connect(audioCtx.destination);

    recRef.current = { stream, audioCtx, source, processor, sink, chunks, ptt };
    listeningRef.current = true;
    pttActiveRef.current = ptt;
    setListening(true);
    setVoiceStage('recording');
    // Clear any banner from the previous turn.
    setLastTranscript('');
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
  }

  async function stopMic() {
    const ctx = recRef.current;
    if (!ctx) return;
    recRef.current = null;
    listeningRef.current = false;
    const wasPtt = pttActiveRef.current;
    pttActiveRef.current = false;
    setListening(false);

    // Tear down audio graph + tracks first so the mic LED turns off promptly.
    try { ctx.processor.disconnect(); } catch {}
    try { ctx.source.disconnect(); } catch {}
    try { ctx.sink.disconnect(); } catch {}
    try { ctx.stream.getTracks().forEach((t) => t.stop()); } catch {}
    const inputRate = ctx.audioCtx.sampleRate;
    try { await ctx.audioCtx.close(); } catch {}

    if (!ctx.chunks.length) {
      setVoiceStage('idle');
      return;
    }
    setVoiceStage('processing');
    const merged = mergeFloat32(ctx.chunks);
    const ds = await resampleTo16k(merged, inputRate);
    const wavBlob = encodeWavMono16k(ds);

    try {
      const lang = vibeVoiceLang && vibeVoiceLang !== 'auto' ? `?lang=${encodeURIComponent(vibeVoiceLang)}` : '';
      const res = await fetch(`${API_URL}/voice-prompt${lang}`, {
        method: 'POST',
        headers: { 'content-type': 'audio/wav' },
        body: wavBlob,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || `Voice HTTP ${res.status}`);
        return;
      }
      const text = (data.text || '').trim();
      if (!text) {
        setError('Empty transcript — speak louder, get closer to the mic, or hold the PTT key longer.');
        return;
      }
      setPrompt(text);
      // Pin a copy of the transcript so it stays visible even after send()
      // clears the textarea — gives the user clear feedback "this is what
      // was heard" without depending on textarea timing.
      setLastTranscript(text);
      // Auto-send if PTT was held + flush ("auto-send after pause") is on.
      // 2-second window so the user can actually read the transcript and
      // optionally cancel by typing into the textarea (see onChange below).
      if (wasPtt && flushRef.current) {
        if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);
        autoSendTimerRef.current = setTimeout(() => {
          autoSendTimerRef.current = null;
          sendRef.current?.();
        }, 2000);
      }
    } catch (err) {
      setError(`Voice pipeline error: ${err.message || err}`);
    } finally {
      setVoiceStage('idle');
    }
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
    hotSwap(code, setError);
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
        {lastTranscript && (
          <div
            className="text-xs px-2 py-1 rounded border border-muted opacity-80 truncate"
            title={lastTranscript}
          >
            <span className="opacity-60">📝 heard:</span> {lastTranscript}
            {autoSendTimerRef.current && (
              <span className="opacity-60 ml-2">— auto-sending in 2s, type to cancel</span>
            )}
          </div>
        )}
        <textarea
          value={prompt}
          onChange={(e) => {
            // User edited — cancel any pending auto-send so the typed text
            // isn't immediately blown away.
            if (autoSendTimerRef.current) {
              clearTimeout(autoSendTimerRef.current);
              autoSendTimerRef.current = null;
            }
            setPrompt(e.target.value);
          }}
          placeholder={
            listening
              ? pttHint
                ? `🎙 Recording… release ${displayKey(pttKey)} to denoise + transcribe`
                : '🎙 Recording… speak now'
              : voiceStage === 'processing'
                ? '✨ Enhancing audio + transcribing… (~5s)'
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
                : voiceStage === 'processing'
                  ? '✨ Enhancing + transcribing…'
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
          {loading ? (
            <button
              onClick={cancelSend}
              title="Cancel in-flight request and edit the prompt"
              className="px-3 py-1 rounded-md border border-foreground text-foreground text-sm hover:opacity-80"
            >
              ✕ Cancel
            </button>
          ) : (
            <button
              onClick={send}
              disabled={!prompt.trim()}
              className={cx(
                'px-3 py-1 rounded-md border border-foreground text-foreground text-sm',
                !prompt.trim() && 'opacity-50 cursor-not-allowed',
              )}
            >
              Send (Enter)
            </button>
          )}
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
