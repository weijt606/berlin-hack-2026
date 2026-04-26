import { Whisper, manager } from 'smart-whisper';

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
 * Lazy whisper.cpp transcriber. Downloads the model on first use (cached
 * in `~/.smart-whisper/models/`) and keeps the process-wide model alive
 * across requests. By default we set a very long idle window so the model
 * stays resident — the alternative is paying ~5 s of disk reload latency
 * whenever the user pauses for longer than the offload timeout.
 *
 * Decoder params worth calling out:
 *   no_context: true       Disables prior-prompt context. Without this
 *                          whisper carries tokens from the previous request
 *                          into the next decode, which shows up as "the
 *                          model just repeated my last prompt back to me"
 *                          hallucinations. Critical for chat-style usage
 *                          where each utterance is independent.
 *   temperature: 0,
 *   temperature_inc: 0     Disables temperature-fallback decoding paths.
 *                          Greedy-only. Fixes repetition / loop
 *                          hallucinations on noisy or short audio.
 *   initial_prompt         Domain vocabulary biasing — see DEFAULT_DJ_VOCAB.
 *
 * @param {{
 *   modelName: string,
 *   gpu: boolean,
 *   language: string,
 *   offloadSecs?: number,
 *   initialPrompt?: string | null,
 * }} cfg
 * @returns {import('../application/ports.mjs').Transcriber}
 */
export function createWhisperTranscriber({
  modelName,
  gpu,
  language,
  offloadSecs,
  initialPrompt,
}) {
  let whisper = null;
  let loadPromise = null;
  const biasingPrompt = initialPrompt || DEFAULT_DJ_VOCAB;

  async function ensureModel() {
    if (whisper) return whisper;
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      if (!manager.check(modelName)) {
        await manager.download(modelName);
      }
      const file = manager.resolve(modelName);
      whisper = new Whisper(file, { gpu, offload: offloadSecs ?? 86400 });
      return whisper;
    })();
    try {
      return await loadPromise;
    } finally {
      loadPromise = null;
    }
  }

  // Fire-and-forget pre-warm. offload: 86400 keeps the model resident BETWEEN
  // requests, but the FIRST request after boot still pays the cold load
  // (~1-5s for base.en, ~5-10s+ for medium.en — disk → RAM, plus the Metal
  // kernel warm-up on the inaugural inference). This kick at construction
  // time moves both costs to boot so the user's first PTT is on the warm
  // path. Errors are non-fatal — they'd surface on the first real request
  // anyway. Doesn't block server.listen because we don't await the promise.
  (async () => {
    const t0 = Date.now();
    const w = await ensureModel();
    const silentPcm = new Float32Array(16000); // 1s of silence at 16 kHz
    const task = await w.transcribe(silentPcm, {
      language: 'en',
      format: 'simple',
      no_timestamps: true,
      no_context: true,
      temperature: 0,
      temperature_inc: 0,
    });
    await task.result;
    console.log(`[whisper-transcriber] pre-warm complete model=${modelName} took=${Date.now() - t0}ms`);
  })().catch((err) => {
    console.warn(`[whisper-transcriber] pre-warm failed: ${err?.message || err}`);
  });

  return {
    getModelId: () => modelName,
    async transcribe(pcm, opts = {}) {
      const w = await ensureModel();
      const lang = opts.language || language;
      const task = await w.transcribe(pcm, {
        language: lang === 'auto' ? 'auto' : lang,
        format: 'simple',
        no_timestamps: true,
        suppress_non_speech_tokens: true,
        no_context: true,
        temperature: 0,
        temperature_inc: 0,
        initial_prompt: biasingPrompt,
      });
      const segments = await task.result;
      const raw = segments.map((s) => s.text).join('').trim();
      return { text: postProcess(raw) };
    },
  };
}
