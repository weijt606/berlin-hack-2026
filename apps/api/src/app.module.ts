import { Module } from '@nestjs/common';
import { HealthController } from './api/health.controller';
import { AppConfigModule } from './config/config.module';
import { LlmModule } from './infrastructure/llm/llm.module';
import { PersistenceModule } from './infrastructure/persistence/persistence.module';

@Module({
  imports: [AppConfigModule, PersistenceModule, LlmModule],
  controllers: [HealthController],
})
export class AppModule {}
