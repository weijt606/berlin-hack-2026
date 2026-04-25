/**
 * Port contracts the application layer depends on.
 * Implementations live in `infrastructure/`.
 *
 * @typedef {Object} LlmCompletion
 * @property {string} text  raw text returned by the model
 * @property {string} model identifier of the model that produced it
 *
 * @typedef {Object} LlmClient
 * @property {(args: { systemPrompt: string, userMessage: string }) => Promise<LlmCompletion>} complete
 *
 * @typedef {Object} AudioEnhancer
 * @property {() => string} getModelId
 * @property {(wavBuffer: Buffer) => Promise<Buffer>} enhance
 */
export {};
