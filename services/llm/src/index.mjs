import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { GoogleGenAI } from '@google/genai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.LLM_PORT || 4323);
const HOST = process.env.LLM_HOST || '0.0.0.0';
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const apiKey = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT_PATH = resolve(__dirname, 'prompts/strudel-system.md');
async function loadSystemPrompt() {
  return readFile(SYSTEM_PROMPT_PATH, 'utf8');
}

const genai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const fastify = Fastify({ logger: true });
await fastify.register(cors, { origin: true });

fastify.get('/health', async () => ({
  ok: true,
  model: MODEL,
  hasApiKey: Boolean(apiKey),
}));

fastify.post('/generate', async (request, reply) => {
  if (!genai) {
    return reply.code(503).send({
      error: 'GEMINI_API_KEY is not set in the root .env file.',
    });
  }

  const { prompt, currentCode, history } = request.body ?? {};
  if (!prompt || typeof prompt !== 'string') {
    return reply.code(400).send({ error: 'Body must include a string `prompt` field.' });
  }

  const contents = [];
  if (Array.isArray(history)) {
    for (const turn of history) {
      if (!turn || typeof turn.text !== 'string') continue;
      contents.push({
        role: turn.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: turn.text }],
      });
    }
  }

  const userMessage = currentCode
    ? `<current>\n${currentCode}\n</current>\n\n${prompt}`
    : prompt;
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  try {
    const systemInstruction = await loadSystemPrompt();
    const response = await genai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    const code = stripCodeFences((response.text ?? '').trim());
    return { code, model: MODEL };
  } catch (err) {
    request.log.error({ err }, 'gemini generate failed');
    return reply.code(502).send({ error: `Gemini error: ${err.message}` });
  }
});

function stripCodeFences(text) {
  const fence = /^```(?:javascript|js|strudel)?\n([\s\S]*?)\n```$/;
  const m = text.match(fence);
  return m ? m[1] : text;
}

await fastify.listen({ port: PORT, host: HOST });
