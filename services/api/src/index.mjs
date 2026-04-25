import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfig } from './config.mjs';
import { createGeminiClient } from './infrastructure/gemini-client.mjs';
import { createOllamaClient } from './infrastructure/ollama-client.mjs';
import { createGeminiStt } from './infrastructure/gemini-stt.mjs';
import { createWhisperStt } from './infrastructure/whisper-stt.mjs';
import { createAicProcessor } from './infrastructure/aic-processor.mjs';
import { createFileSessionStore } from './infrastructure/file-session-store.mjs';
import { makeGenerateStrudel } from './application/generate-strudel.mjs';
import { makeEnhanceAudio } from './application/enhance-audio.mjs';
import { makeVoicePrompt } from './application/voice-prompt.mjs';
import { makeTranscriptNormalizer } from './application/transcript-normalizer.mjs';
import { makeChatSession } from './application/chat-session.mjs';
import { createServer } from './interface/http/server.mjs';

// Composition root: the only place that wires concrete dependencies
// into the application layer. Everything else depends on contracts.

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = loadConfig();

// Composable Strudel skill: rules + reference + recipes + examples loaded in
// the order declared in skills/strudel/SKILL.md. Re-read on every request
// (handled by generateStrudel) so editing the skill doesn't require a restart.
const SKILL_ROOT = resolve(__dirname, 'skills/strudel');

// Full set: ~50 KB, ~16K input tokens. Ideal for Gemini / Qwen3-A3B / any
// host with fast prefill. On dense local models <14B prefill takes 30s+ which
// kills the live-coding loop — use the minimal set instead.
const FULL_SKILL_ORDER = [
  'rules/output-format.md',
  'rules/iteration.md',
  'rules/host-controls.md',
  'rules/diversity.md',
  'rules/uncertainty.md',
  'reference/sounds.md',
  'reference/mini-notation.md',
  'reference/pattern-transforms.md',
  'reference/effects.md',
  'reference/modulation.md',
  'reference/tempo.md',
  'reference/visualization.md',
  'reference/dual-deck.md',
  'recipes/generate.md',
  'recipes/explain.md',
  'recipes/debug.md',
  'recipes/vary.md',
  'examples/genres.md',
  'examples/techniques.md',
];

// Minimal set: matches skills/strudel/README.md "minimum viable" subset.
// Drops everything that isn't strictly needed to produce a valid pattern:
// no host-controls / uncertainty meta-rules, no recipes, no advanced effects
// /modulation/tempo/dual-deck reference, no techniques fragments. Keeps the
// non-negotiable output rules (incl. mandatory .scope() + compile self-check),
// the sound name allowlist, mini-notation cheatsheet, core transforms,
// visualization options, and the genre templates the model can mutate.
const MINIMAL_SKILL_ORDER = [
  'rules/output-format.md',
  'rules/iteration.md',
  'rules/diversity.md',
  'reference/sounds.md',
  'reference/mini-notation.md',
  'reference/pattern-transforms.md',
  'reference/visualization.md',
  'examples/genres.md',
  'recipes/generate.md',
];

// PROMPT_MODE: full | minimal. Default = minimal for ollama (slow prefill on
// dense local models), full for gemini (fast prefill on hosted hardware).
const PROMPT_MODE = (process.env.PROMPT_MODE
  || (config.llm.provider === 'ollama' ? 'minimal' : 'full')).toLowerCase();
const SKILL_ORDER = PROMPT_MODE === 'minimal' ? MINIMAL_SKILL_ORDER : FULL_SKILL_ORDER;

const loadSystemPrompt = async () => {
  const parts = await Promise.all(
    SKILL_ORDER.map((rel) => readFile(resolve(SKILL_ROOT, rel), 'utf8')),
  );
  return parts.join('\n\n---\n\n');
};

// Fail-fast: read every skill file at boot so a missing/renamed entry surfaces
// during startup instead of on the first /generate request.
const _bootPrompt = await loadSystemPrompt();
console.log(`[llm] prompt_mode=${PROMPT_MODE} files=${SKILL_ORDER.length} chars=${_bootPrompt.length}`);

// LLM_PROVIDER picks which backend to use:
//   gemini → Google AI Studio (default; needs GEMINI_API_KEY)
//   ollama → local Ollama daemon (needs the model already pulled)
function buildLlmClient(llmCfg) {
  if (llmCfg.provider === 'ollama') {
    return createOllamaClient(llmCfg.ollama);
  }
  return createGeminiClient(llmCfg.gemini);
}
const llmClient = buildLlmClient(config.llm);
console.log(`[llm] provider=${config.llm.provider}`);
const audioEnhancer = createAicProcessor({
  ...config.audio,
  modelsDir: resolve(__dirname, '..', 'models'),
});
const sessionStore = createFileSessionStore({
  dir: config.sessions.dir || resolve(__dirname, '..', 'data', 'sessions'),
});

// STT for the voice-prompt path.
//   STT_PROVIDER=gemini  → Gemini multimodal, cloud, quota-bound
//   STT_PROVIDER=whisper → local whisper.cpp via nodejs-whisper, no quota
function buildSttClient() {
  if (config.stt.provider === 'whisper') {
    const modelRootPath = config.stt.whisper.modelRootPath
      || resolve(__dirname, '..', 'models', 'whisper');
    console.log(`[stt] provider=whisper model=${config.stt.whisper.modelName} root=${modelRootPath}`);
    return createWhisperStt({
      modelName: config.stt.whisper.modelName,
      modelRootPath,
      ...(config.stt.whisper.initialPrompt
        ? { initialPrompt: config.stt.whisper.initialPrompt }
        : {}),
    });
  }
  console.log(`[stt] provider=gemini model=${config.llm.gemini.sttModel}`);
  return createGeminiStt({
    apiKey: config.llm.gemini.apiKey,
    model: config.llm.gemini.sttModel,
  });
}
const sttClient = buildSttClient();

// Optional: post-STT LLM cleanup. Catches recognition errors the static
// dictionary in whisper-stt can't (artist names, half-heard phrases, fillers).
// Default ON; set LLM_CORRECT_TRANSCRIPT=false to disable (saves 1 Gemini call
// per voice prompt).
const correctEnabled = process.env.LLM_CORRECT_TRANSCRIPT !== 'false';
const transcriptNormalizer = correctEnabled ? makeTranscriptNormalizer({ llmClient }) : null;
console.log(`[transcript-normalizer] ${transcriptNormalizer ? 'enabled' : 'disabled'}`);

const generateStrudel = makeGenerateStrudel({ llmClient, loadSystemPrompt });
const enhanceAudio = makeEnhanceAudio({ audioEnhancer });
const voicePrompt = makeVoicePrompt({ audioEnhancer, sttClient, transcriptNormalizer });
const chatSession = makeChatSession({ sessionStore, generateStrudel });

const server = await createServer({
  config,
  deps: {
    config,
    llmClient,
    audioEnhancer,
    sttClient,
    sessionStore,
    generateStrudel,
    enhanceAudio,
    voicePrompt,
    chatSession,
  },
});

await server.listen({ port: config.server.port, host: config.server.host });
