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

const systemPrompt = await readFile(
  resolve(__dirname, 'prompts/strudel-system.md'),
  'utf8',
);

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

  const { prompt, currentCode } = request.body ?? {};
  if (!prompt || typeof prompt !== 'string') {
    return reply.code(400).send({ error: 'Body must include a string `prompt` field.' });
  }

  const userMessage = currentCode
    ? `<current>\n${currentCode}\n</current>\n\n${prompt}`
    : prompt;

  try {
    const response = await genai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      config: {
        systemInstruction: systemPrompt,
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
