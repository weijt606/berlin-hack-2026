/**
 * Port contracts the application layer depends on.
 * Implementations live in `infrastructure/`.
 *
 * @typedef {{ role: 'user' | 'assistant', text: string }} ChatTurn
 *
 * @typedef {Object} LlmCompletion
 * @property {string} text  raw text returned by the model
 * @property {string} model identifier of the model that produced it
 *
 * @typedef {Object} LlmCompleteArgs
 * @property {string} systemPrompt
 * @property {string} userMessage  message for this turn (may embed <current> code)
 * @property {ChatTurn[]} [history] prior conversation turns in chronological order
 *
 * @typedef {Object} LlmClient
 * @property {(args: LlmCompleteArgs) => Promise<LlmCompletion>} complete
 *
 * @typedef {Object} AudioEnhancer
 * @property {() => string} getModelId
 * @property {(wavBuffer: Buffer) => Promise<Buffer>} enhance
 *
 * @typedef {() => Promise<string>} SystemPromptProvider
 */
export {};
