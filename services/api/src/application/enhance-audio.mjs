import { InvalidInput, ServiceUnavailable } from '../domain/errors.mjs';

/**
 * @param {{ audioEnhancer: import('./ports.mjs').AudioEnhancer | null }} deps
 */
export function makeEnhanceAudio({ audioEnhancer }) {
  return async function enhanceAudio({ wavBuffer }) {
    if (!audioEnhancer) {
      throw new ServiceUnavailable('AIC_SDK_LICENSE is not set in the root .env file.');
    }
    if (!Buffer.isBuffer(wavBuffer) || wavBuffer.length === 0) {
      throw new InvalidInput(
        'POST a WAV file as the request body (Content-Type: audio/wav).',
      );
    }
    return audioEnhancer.enhance(wavBuffer);
  };
}
