export interface HealthCheckResponse {
  status: 'ok';
  timestamp: string;
}

export interface LlmCompletionRequest {
  prompt: string;
  system?: string;
}

export interface LlmCompletionResponse {
  text: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}
