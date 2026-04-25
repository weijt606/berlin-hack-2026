import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import wavefile from 'wavefile';
const { WaveFile } = wavefile;
import { Model, Processor, getVersion } from '@ai-coustics/aic-sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = resolve(__dirname, '..', 'models');
const MODEL_ID = process.env.AIC_MODEL_ID || 'quail-vf-2.1-l-16khz';
const PORT = Number(process.env.AUDIO_ENHANCE_PORT || 4322);
const HOST = process.env.AUDIO_ENHANCE_HOST || '0.0.0.0';
const MAX_BODY = Number(process.env.AUDIO_ENHANCE_MAX_BYTES || 50 * 1024 * 1024);

const licenseKey = process.env.AIC_SDK_LICENSE;
if (!licenseKey) {
  console.error('Missing AIC_SDK_LICENSE in environment (.env)');
  process.exit(1);
}

mkdirSync(MODELS_DIR, { recursive: true });
const modelPath = Model.download(MODEL_ID, MODELS_DIR);
const model = Model.fromFile(modelPath);

const fastify = Fastify({ logger: true, bodyLimit: MAX_BODY });
await fastify.register(cors, { origin: true });
fastify.addContentTypeParser(
  ['audio/wav', 'audio/x-wav', 'application/octet-stream'],
  { parseAs: 'buffer' },
  (_req, body, done) => done(null, body),
);

fastify.get('/health', async () => ({
  ok: true,
  sdk: getVersion(),
  model: model.getId(),
}));

fastify.post('/enhance', async (request, reply) => {
  const buf = request.body;
  if (!Buffer.isBuffer(buf) || buf.length === 0) {
    return reply
      .code(400)
      .send({ error: 'POST a WAV file as the request body (Content-Type: audio/wav).' });
  }

  let wav;
  try {
    wav = new WaveFile(buf);
    wav.toBitDepth('32f');
  } catch (err) {
    return reply.code(400).send({ error: `Invalid WAV: ${err.message}` });
  }

  const sampleRate = wav.fmt.sampleRate;
  const numChannels = wav.fmt.numChannels;
  const numFrames = model.getOptimalNumFrames(sampleRate);
  const samples = wav.getSamples(true, Float32Array);

  const processor = new Processor(model, licenseKey);
  processor.initialize(sampleRate, numChannels, numFrames, false);

  const chunkSize = numChannels * numFrames;
  for (let i = 0; i < samples.length; i += chunkSize) {
    if (i + chunkSize <= samples.length) {
      processor.processInterleaved(samples.subarray(i, i + chunkSize));
    } else {
      const padded = new Float32Array(chunkSize);
      padded.set(samples.subarray(i));
      processor.processInterleaved(padded);
      samples.set(padded.subarray(0, samples.length - i), i);
    }
  }

  const channels = Array.from(
    { length: numChannels },
    () => new Float32Array(samples.length / numChannels),
  );
  for (let i = 0; i < samples.length; i++) {
    channels[i % numChannels][(i / numChannels) | 0] = samples[i];
  }

  const out = new WaveFile();
  out.fromScratch(numChannels, sampleRate, '32f', channels);

  return reply
    .header('content-type', 'audio/wav')
    .send(Buffer.from(out.toBuffer()));
});

await fastify.listen({ port: PORT, host: HOST });
