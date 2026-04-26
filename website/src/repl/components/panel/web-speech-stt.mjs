// Browser-native speech recognizer using the HTML5 Web Speech API
// (SpeechRecognition / webkitSpeechRecognition). Runs entirely client-side —
// no audio is sent to the server. Pairs a SpeechRecognition instance with a
// small AnalyserNode loop to feed the existing VU meter.
//
// Browser support is effectively Chrome/Edge/Safari Tech Preview. Firefox
// returns null from getRecognitionCtor() and the caller surfaces a friendly
// error — the rest of the Vibe panel still works for typed prompts.

function getRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isWebSpeechSupported() {
  return !!getRecognitionCtor();
}

/**
 * @param {{
 *   lang?: string,                // BCP-47 hint, e.g. 'en-US'. 'auto' / falsy → browser default.
 *   continuous?: boolean,         // keep listening across pauses (auto-send-after-silence mode)
 *   onTranscript?: (text: string, opts: { isFinal: boolean }) => void,
 *   onSilence?: () => void,       // fired when the recognizer detects end of utterance
 *   onLevel?: (rms: number) => void,
 *   onError?: (message: string) => void,
 * }} [opts]
 */
export function createSpeechRecognizer(opts = {}) {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    return {
      async start() {
        throw new Error('Speech recognition not supported in this browser. Try Chrome or Edge.');
      },
      async stop() {
        return null;
      },
      isActive() {
        return false;
      },
    };
  }

  const lang = opts.lang && opts.lang !== 'auto' ? opts.lang : undefined;
  const continuous = !!opts.continuous;
  const onTranscript = opts.onTranscript;
  const onSilence = opts.onSilence;
  const onLevel = opts.onLevel;
  const onError = opts.onError;

  let recog = null;
  let stream = null;
  let ctx = null;
  let analyser = null;
  let raf = 0;
  let active = false;
  // Bookkeeping for graceful stop(): when stop() is called we want the
  // recognizer's last final result to land *before* we resolve, so callers
  // get the full transcript even if they release PTT mid-word.
  let stoppingResolve = null;
  let lastFinalText = '';

  async function start() {
    if (active) return;
    active = true;
    lastFinalText = '';

    // Mic capture for the VU meter only — SpeechRecognition opens its own
    // mic stream internally and we have no access to its audio.
    if (onLevel) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, autoGainControl: false },
        });
        const Ctx = window.AudioContext || window.webkitAudioContext;
        ctx = new Ctx();
        const source = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        const buf = new Float32Array(analyser.fftSize);
        const tick = () => {
          if (!analyser) return;
          analyser.getFloatTimeDomainData(buf);
          let sumSq = 0;
          for (let i = 0; i < buf.length; i++) sumSq += buf[i] * buf[i];
          onLevel(Math.sqrt(sumSq / buf.length));
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        // Meter is best-effort; keep going without it if mic is denied here.
        // (SpeechRecognition will surface its own permission error.)
      }
    }

    recog = new Ctor();
    if (lang) recog.lang = lang;
    recog.continuous = continuous;
    recog.interimResults = true;
    recog.maxAlternatives = 1;

    recog.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || '';
        if (result.isFinal) {
          lastFinalText = transcript.trim();
          onTranscript?.(lastFinalText, { isFinal: true });
        } else {
          interim += transcript;
        }
      }
      if (interim) onTranscript?.(interim.trim(), { isFinal: false });
    };
    recog.onerror = (event) => {
      // 'no-speech' and 'aborted' are routine for PTT — surface only real failures.
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      onError?.(event.error || 'speech recognition error');
    };
    recog.onspeechend = () => {
      onSilence?.();
    };
    recog.onend = () => {
      cleanup();
      const resolve = stoppingResolve;
      stoppingResolve = null;
      resolve?.(lastFinalText || null);
    };

    try {
      recog.start();
    } catch (err) {
      cleanup();
      throw err;
    }
  }

  function cleanup() {
    active = false;
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (analyser) {
      try { analyser.disconnect(); } catch {}
      analyser = null;
    }
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    if (ctx) {
      ctx.close().catch(() => {});
      ctx = null;
    }
    recog = null;
  }

  function stop() {
    if (!active || !recog) {
      cleanup();
      return Promise.resolve(lastFinalText || null);
    }
    return new Promise((resolve) => {
      stoppingResolve = resolve;
      try {
        recog.stop();
      } catch {
        cleanup();
        resolve(lastFinalText || null);
      }
    });
  }

  function isActive() {
    return active;
  }

  return { start, stop, isActive };
}
