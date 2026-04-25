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

const SYSTEM_PROMPT_PATH = resolve(__dirname, 'prompts/strudel-system.md');
const loadSystemPrompt = () => readFile(SYSTEM_PROMPT_PATH, 'utf8');

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
