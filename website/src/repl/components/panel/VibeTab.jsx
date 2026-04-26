import { useEffect, useMemo, useRef, useState } from 'react';
import cx from '@src/cx.mjs';
import { useSettings } from '../../../settings.mjs';
import { useStore } from '@nanostores/react';
import { $selectedTrackId, $selectedTrack, setTrackCode, setTrackViz } from '../../tracks/tracksStore.mjs';
import { createVoiceRecorder } from './voice-recorder.mjs';
import { displayKey, isTextInput } from './vibe/keyHelpers.mjs';
import { readOrCreateSessionId, clearSessionId } from './vibe/sessionId.mjs';
import { fetchSessionMessages, postGenerate, postTranscribe, deleteSession } from './vibe/vibeApi.mjs';
import { Waveform } from './vibe/Waveform.jsx';
import { Message } from './vibe/Message.jsx';

const FLUSH_KEY = 'strudel:vibe:silenceFlush';
const SILENCE_MS_KEY = 'strudel:vibe:silenceMs';
const SILENCE_OPTIONS = [2000, 3000, 5000, 8000, 10000];
const DEFAULT_SILENCE_MS = 5000;
const WAVEFORM_BARS = 18;

// Re-export so existing settings UI that imports these from VibeTab keeps working.
export { displayKey };
export { NON_PTT_CODES } from './vibe/keyHelpers.mjs';

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

// Apply incoming code (and optional viz suggestion) to the *selected*
// track: update the persisted store and hot-swap the live editor so
// playback continues seamlessly.
function applyCodeToSelectedTrack(code, viz) {
  if (!code) return;
  const id = $selectedTrackId.get();
  if (!id) return;
  setTrackCode(id, code);
  if (viz) setTrackViz(id, viz);
  if (typeof window === 'undefined') return;
  // window.strudelMirror always points at the selected track's editor.
  const editor = window.strudelMirror;
  if (!editor) return;
  editor.setCode(code);
  editor.evaluate(true);
}

export function VibeTab() {
  const { fontFamily, vibePttKey: pttKey, vibeAutoApply: auto } = useSettings();
  const selectedTrackId = useStore($selectedTrackId);
  const selectedTrack = useStore($selectedTrack);

  // Bail early to a friendly placeholder when nothing is selected.
  if (!selectedTrackId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-sm opacity-60 text-center px-6 py-10" style={{ fontFamily }}>
        <div className="mb-2">No track selected</div>
        <div className="text-xs">Pick a track on the left to start vibing.</div>
      </div>
    );
  }

  return (
    <VibeForTrack
      key={selectedTrackId}
      trackId={selectedTrackId}
      trackName={selectedTrack?.name || 'this track'}
      pttKey={pttKey}
      auto={auto}
      fontFamily={fontFamily}
    />
  );
}

function VibeForTrack({ trackId, trackName, pttKey, auto, fontFamily }) {
  const sessionId = useMemo(() => readOrCreateSessionId(trackId), [trackId]);

  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [flush, setFlush] = useState(readFlush);
  const [silenceMs, setSilenceMs] = useState(readSilenceMs);
  const [pttHint, setPttHint] = useState(false);
  const [waveform, setWaveform] = useState(() => new Array(WAVEFORM_BARS).fill(0));

  const recorderRef = useRef(null);
  const pttActiveRef = useRef(false);
  const pttKeyDownRef = useRef(false);
  const scrollRef = useRef(null);
  const sendRef = useRef(null);
  const flushRef = useRef(flush);
  const silenceMsRef = useRef(silenceMs);
  const levelBufferRef = useRef(new Array(WAVEFORM_BARS).fill(0));

  useEffect(() => {
    flushRef.current = flush;
    if (typeof window !== 'undefined') window.localStorage?.setItem(FLUSH_KEY, String(flush));
  }, [flush]);
  useEffect(() => {
    silenceMsRef.current = silenceMs;
    if (typeof window !== 'undefined') window.localStorage?.setItem(SILENCE_MS_KEY, String(silenceMs));
  }, [silenceMs]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // Pump the level buffer into React state at ~30 fps while listening.
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

  // Hydrate chat history when the (per-track) session id changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const msgs = await fetchSessionMessages(sessionId);
        if (!cancelled) setMessages(msgs);
      } catch {
        /* backend offline → empty history */
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
    const currentCode = (typeof window !== 'undefined' && window.strudelMirror?.code) || '';
    setMessages((prev) => [...prev, { role: 'user', text, ts: 'pending' }]);
    setPrompt('');
    try {
      const data = await postGenerate({ sessionId, prompt: text, currentCode });
      if (Array.isArray(data.messages)) setMessages(data.messages);
      const code = data.code || '';
      if (auto && code && !data.noChange) applyCodeToSelectedTrack(code, data.viz);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  sendRef.current = send;

  function startRecording({ ptt = false } = {}) {
    if (recorderRef.current) return;
    setError('');
    const recorder = createVoiceRecorder({
      silenceMs: ptt && flushRef.current ? silenceMsRef.current : 0,
      onSilence: handleSilenceFlush,
      onLevel: (rms) => {
        const buf = levelBufferRef.current;
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
    if (pttKeyDownRef.current) startRecording({ ptt: true });
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
    if (!wavBlob || wavBlob.size < 2048) return;
    setTranscribing(true);
    try {
      const data = await postTranscribe({ sessionId, wavBlob });
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

  // Global push-to-talk handler.
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
      if (recorderRef.current && pttActiveRef.current) stopRecording();
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pttKey]);

  function reuse(code, viz) {
    applyCodeToSelectedTrack(code, viz);
  }

  async function reset() {
    setMessages([]);
    setError('');
    try {
      await deleteSession(sessionId);
    } catch (err) {
      setError(err.message || String(err));
    }
    clearSessionId(trackId);
  }

  return (
    <div className="flex flex-col h-full w-full" style={{ fontFamily }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-muted text-xs opacity-70 shrink-0 gap-2">
        <span className="truncate">Vibe coding · {trackName}</span>
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
            Describe a track or a change. Each turn iterates on whatever is currently in the editor — no need to repeat what's already there.
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>"lo-fi hip-hop at 80 bpm with a soft kick and rhodes chords"</li>
              <li>"make the bass more dubby"</li>
              <li>"swap the drums for a 909 kit and double the tempo"</li>
            </ul>
            <div className="mt-3 opacity-80">
              Hold <kbd className="px-1 border border-muted rounded">{displayKey(pttKey)}</kbd> anywhere on the page to talk, release to send.
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
                : `Describe the change. Enter to send, Shift+Enter for newline. Hold ${displayKey(pttKey)} for push-to-talk.`
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
