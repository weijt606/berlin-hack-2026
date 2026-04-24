export const LLM_PORT = Symbol('LLM_PORT');

export interface LlmMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LlmCompletionInput {
  messages: LlmMessage[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LlmCompletionOutput {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  model: string;
}

export interface LlmPort {
  complete(input: LlmCompletionInput): Promise<LlmCompletionOutput>;
}
