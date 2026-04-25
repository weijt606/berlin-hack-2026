import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Locate the whisper-server binary built by nodejs-whisper at install/build time.
const WHISPER_SERVER_BIN = resolve(
  __dirname,
  '..', '..',
  'node_modules', 'nodejs-whisper',
  'cpp', 'whisper.cpp', 'build', 'bin', 'whisper-server',
);

// Domain-specific biasing prompt fed to whisper as `initial_prompt`. The
// decoder uses this as recent-context, so words that appear here are far
// more likely to be picked over phonetic neighbours. Sentence-like prose
// works better than a comma list — and for tricky proper nouns (Berghain),
// repetition helps the model lock onto the exact spelling.
//
// Mishears we're specifically targeting:
//   "berghain" → "Burgaine" / "Burgane" / "berg high"
//   "lo-fi"    → "low-fi"
//   "dubby"    → "doubty"
//   "Rhodes"   → "roads"
//   "bass"     → "base"     (homophone — also handled by post-process)
const DEFAULT_DJ_VOCAB =
  'This is a live coding session with Strudel. The user is a DJ giving ' +
  'commands to vibe code rave music. Genres include techno, house, deep ' +
  'house, lo-fi, dub, dubby, drum and bass, ambient, acid, breakbeat, ' +
  'chiptune, drone, jazz, disco. The DJ often references Berghain, the ' +
  'famous Berlin techno club — make it sound like Berghain, in the ' +
  'Berghain style, Berghain bass. Drum machines used: RolandTR909, ' +
  'RolandTR808, LinnDrum, AkaiMPC60. Drum hits: kick, snare, hi-hat, ' +
  'open hat, clap, cowbell, ride, rim, tom. Synths: sawtooth, square, ' +
  'triangle, sine, Rhodes piano, sub bass, acid bass, lead, pad. ' +
  'Effects: lpf, hpf, reverb, room, delay, sidechain ducking, crush, ' +
  'distortion, phaser, vowel filter. Tempo: 80 bpm, 124 bpm, 140 bpm, ' +
  '174 bpm. Actions: drop the bass, half time, double time, build up, ' +
  'bring back the kick.';

// Post-process replacement table. Whisper consistently makes these errors
// even with biasing — handle them deterministically. Order matters: more
// specific patterns first.
const POST_PROCESS_FIXES = [
  // Berghain spelling variants (TTS / many real speakers).
  [/\bBurg[a-z]*ine?\b/gi, 'Berghain'],
  [/\bBurg[a-z]*ane\b/gi, 'Berghain'],
  [/\bBurg high\b/gi, 'Berghain'],
  [/\bBerg high\b/gi, 'Berghain'],
  // bass / base homophone — in this domain, "base" almost certainly means "bass".
  [/\bacid base\b/gi, 'acid bass'],
  [/\bsub base\b/gi, 'sub bass'],
  [/\bduck on the base\b/gi, 'duck on the bass'],
  [/\b(drop|cut|kill|boost|bring back) the base\b/gi, '$1 the bass'],
  [/\bbase ?line\b/gi, 'bassline'],
  // lo-fi normalisation
  [/\blow[ -]?fi\b/gi, 'lo-fi'],
  // Rhodes proper noun
  [/\broad piano\b/gi, 'Rhodes piano'],
  [/\broads piano\b/gi, 'Rhodes piano'],
  // bpm number → digits + lowercase unit
  [/(\d+)\s*BPM\b/g, '$1 bpm'],
];

function postProcess(text) {
  let out = text;
  for (const [re, replacement] of POST_PROCESS_FIXES) {
    out = out.replace(re, replacement);
  }
  return out;
}

/**
 * whisper.cpp HTTP server-backed STT. Keeps the GGML model loaded in memory
 * (vs nodejs-whisper which spawns a fresh whisper-cli per call and reloads
 * the 142 MB base.en weights every time → 5-6s warm latency). With the
 * server, warm calls are sub-second on Apple Silicon.
 *
 * @param {{
 *   modelName: string,            // e.g. 'base.en' — used to find ggml-<name>.bin
 *   modelRootPath: string,        // dir containing ggml-<modelName>.bin
 *   port?: number,                // default 8765
 *   threads?: number,             // default 4
 *   initialPrompt?: string,       // biasing context for the decoder
 * }} cfg
 * @returns {import('../application/ports.mjs').SttClient}
 */
export function createWhisperStt({ modelName, modelRootPath, port = 8765, threads = 4, initialPrompt = DEFAULT_DJ_VOCAB }) {
  const modelPath = resolve(modelRootPath, `ggml-${modelName}.bin`);
  if (!existsSync(modelPath)) {
    throw new Error(
      `[whisper-stt] model not found at ${modelPath}. Run an /voice-prompt request once with nodejs-whisper, or fetch it manually from https://huggingface.co/ggerganov/whisper.cpp/`,
    );
  }
  if (!existsSync(WHISPER_SERVER_BIN)) {
    throw new Error(
      `[whisper-stt] whisper-server binary missing at ${WHISPER_SERVER_BIN}. Build with:\n  cd services/api/node_modules/nodejs-whisper/cpp/whisper.cpp && cmake -B build && cmake --build build --config Release`,
    );
  }

  const baseUrl = `http://127.0.0.1:${port}`;

  // Boot whisper-server. Keep it alive for the api process lifetime.
  //
  //   -mc 0 / --max-context 0   disables prior-prompt context. Without this
  //                              whisper-server carries over tokens from the
  //                              previous request into the next decode, which
  //                              shows up as "the model just repeated my last
  //                              prompt back to me" hallucinations. Critical
  //                              for our chat-style usage where each utterance
  //                              is independent.
  //   --no-fallback             skips temperature-fallback decoding paths that
  //                              are a common source of repetition / loop
  //                              hallucinations on noisy or short audio.
  const proc = spawn(
    WHISPER_SERVER_BIN,
    [
      '-m', modelPath,
      '--host', '127.0.0.1',
      '--port', String(port),
      '--threads', String(threads),
      '--inference-path', '/inference',
      '--max-context', '0',
      '--no-fallback',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  proc.stdout.on('data', (b) => {
    const s = b.toString();
    if (/error|fail|warning/i.test(s)) console.log(`[whisper-server] ${s.trimEnd()}`);
  });
  proc.stderr.on('data', (b) => {
    const s = b.toString();
    // whisper-server logs progress / model info to stderr — only surface real errors
    if (/error|fail|abort/i.test(s)) console.error(`[whisper-server] ${s.trimEnd()}`);
  });
  proc.on('exit', (code) => {
    console.error(`[whisper-server] exited with code=${code}`);
  });
  process.on('exit', () => { try { proc.kill(); } catch {} });
  process.on('SIGINT', () => { try { proc.kill(); } catch {} ; process.exit(); });
  process.on('SIGTERM', () => { try { proc.kill(); } catch {} ; process.exit(); });

  console.log(`[whisper-stt] spawned whisper-server pid=${proc.pid} model=${modelName} port=${port}`);

  // Wait for the server to become reachable. whisper-server takes ~1-3s to load
  // the model; we lazily ping it on the first transcribe call.
  let ready = false;
  async function waitReady() {
    if (ready) return;
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(`${baseUrl}/`, { method: 'GET' });
        if (res.status < 500) { ready = true; return; }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    throw new Error('[whisper-stt] whisper-server did not become reachable in 30s');
  }

  async function postInference(wavBuffer, language) {
    const fd = new FormData();
    fd.append('file', new Blob([wavBuffer], { type: 'audio/wav' }), 'audio.wav');
    fd.append('temperature', '0.0');
    fd.append('temperature_inc', '0.2');
    fd.append('response_format', 'json');
    fd.append('language', language);
    if (initialPrompt) fd.append('prompt', initialPrompt);
    // Resilience to transient connect resets — medium.en's first real inference
    // can spike the process and drop the listening socket for a few hundred ms.
    // We retry up to 3 times with backoff before giving up.
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`${baseUrl}/inference`, { method: 'POST', body: fd });
        if (!res.ok) {
          const detail = await res.text().catch(() => '');
          throw new Error(`whisper-server HTTP ${res.status}: ${detail.slice(0, 200)}`);
        }
        return await res.json();
      } catch (err) {
        lastErr = err;
        // Only retry on transient network-level failures, not HTTP ≥ 400.
        if (!String(err?.message || err).includes('fetch failed')) throw err;
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
    throw lastErr;
  }

  // Pre-warm the model: after the server is reachable, send a 1s silent WAV
  // through /inference once. This forces the model weights into RAM so the
  // first user request doesn't pay a 5-6s cold load.
  (async () => {
    try {
      await waitReady();
      const silentWav = makeSilentWav(1.0); // 1 second of silence at 16kHz
      await postInference(silentWav, 'en');
      console.log(`[whisper-stt] pre-warm done (model ${modelName} resident)`);
    } catch (err) {
      console.warn(`[whisper-stt] pre-warm failed: ${err.message || err}`);
    }
  })();

  return {
    async transcribe({ wavBuffer, languageHint }) {
      await waitReady();
      const language =
        languageHint && /^zh/i.test(languageHint) ? 'zh'
        : languageHint && /^en/i.test(languageHint) ? 'en'
        : 'auto';
      const data = await postInference(wavBuffer, language);
      const raw = String(data?.text || '').trim();
      const text = postProcess(raw);
      return { text, model: `whisper.cpp/${modelName}` };
    },
  };
}

function makeSilentWav(seconds) {
  const sr = 16000;
  const n = Math.floor(seconds * sr);
  const dataSize = n * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);    // PCM
  buf.writeUInt16LE(1, 22);    // mono
  buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  // samples already zero-filled
  return buf;
}
