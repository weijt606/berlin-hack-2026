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
 * @typedef {Object} SttResult
 * @property {string} text
 * @property {string} model
 *
 * @typedef {Object} SttTranscribeArgs
 * @property {Buffer} wavBuffer
 * @property {string|null} [languageHint]  optional ISO-like hint, e.g. "en-US"
 *
 * @typedef {Object} SttClient
 * @property {(args: SttTranscribeArgs) => Promise<SttResult>} transcribe
 *
 * @typedef {() => Promise<string>} SystemPromptProvider
 *
 * @typedef {{ role: 'user', text: string, ts: string }
 *   | { role: 'assistant', code: string, ts: string }} StoredMessage
 *
 * @typedef {Object} ChatSessionRecord
 * @property {string} id
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {StoredMessage[]} messages
 *
 * @typedef {Object} SessionStore
 * @property {(id: string) => Promise<ChatSessionRecord>} load    returns an empty record for unknown ids
 * @property {(record: ChatSessionRecord) => Promise<void>} save  upserts; sets updatedAt
 * @property {(id: string) => Promise<void>} clear                no-op if missing
 */
export {};
