import { Module } from '@nestjs/common';
import { LLM_PORT } from '../../domain/ports/llm.port';
import { AnthropicAdapter } from './anthropic.adapter';

@Module({
  providers: [
    AnthropicAdapter,
    {
      provide: LLM_PORT,
      useExisting: AnthropicAdapter,
    },
  ],
  exports: [LLM_PORT],
})
export class LlmModule {}
