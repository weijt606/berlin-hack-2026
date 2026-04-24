import Anthropic from '@anthropic-ai/sdk';
import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import type {
  LlmCompletionInput,
  LlmCompletionOutput,
  LlmPort,
} from '../../domain/ports/llm.port';

@Injectable()
export class AnthropicAdapter implements LlmPort {
  private readonly client: Anthropic;

  constructor(private readonly config: AppConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.anthropic.apiKey,
    });
  }

  async complete(input: LlmCompletionInput): Promise<LlmCompletionOutput> {
    const { model, maxTokens } = this.config.anthropic;

    const response = await this.client.messages.create({
      model,
      max_tokens: input.maxTokens ?? maxTokens,
      temperature: input.temperature,
      system: input.system,
      messages: input.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return {
      text,
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}
