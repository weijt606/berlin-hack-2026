import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfig } from './config.mjs';
import { createGeminiClient } from './infrastructure/gemini-client.mjs';
import { createAicProcessor } from './infrastructure/aic-processor.mjs';
import { createFileSessionStore } from './infrastructure/file-session-store.mjs';
import { makeGenerateStrudel } from './application/generate-strudel.mjs';
import { makeEnhanceAudio } from './application/enhance-audio.mjs';
import { makeChatSession } from './application/chat-session.mjs';
import { createServer } from './interface/http/server.mjs';

// Composition root: the only place that wires concrete dependencies
// into the application layer. Everything else depends on contracts.

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = loadConfig();

// Composable Strudel skill: rules + reference + examples loaded in the order
// declared in skills/strudel/SKILL.md. Re-read on every request (handled by
// generateStrudel) so editing the skill doesn't require a server restart.
const SKILL_ROOT = resolve(__dirname, 'skills/strudel');
const SKILL_ORDER = [
  'rules/output-format.md',
  'rules/iteration.md',
  'rules/host-controls.md',
  'rules/uncertainty.md',
  'reference/sounds.md',
  'reference/mini-notation.md',
  'reference/pattern-transforms.md',
  'reference/effects.md',
  'reference/modulation.md',
  'reference/tempo.md',
  'reference/visualization.md',
  'reference/dual-deck.md',
  'examples/genres.md',
  'examples/techniques.md',
];
const loadSystemPrompt = async () => {
  const parts = await Promise.all(
    SKILL_ORDER.map((rel) => readFile(resolve(SKILL_ROOT, rel), 'utf8')),
  );
  return parts.join('\n\n---\n\n');
};

const llmClient = createGeminiClient(config.llm);
const audioEnhancer = createAicProcessor({
  ...config.audio,
  modelsDir: resolve(__dirname, '..', 'models'),
});
const sessionStore = createFileSessionStore({
  dir: config.sessions.dir || resolve(__dirname, '..', 'data', 'sessions'),
});

const generateStrudel = makeGenerateStrudel({ llmClient, loadSystemPrompt });
const enhanceAudio = makeEnhanceAudio({ audioEnhancer });
const chatSession = makeChatSession({ sessionStore, generateStrudel });

const server = await createServer({
  config,
  deps: {
    config,
    llmClient,
    audioEnhancer,
    sessionStore,
    generateStrudel,
    enhanceAudio,
    chatSession,
  },
});

await server.listen({ port: config.server.port, host: config.server.host });
