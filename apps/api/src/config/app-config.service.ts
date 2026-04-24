import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './env.schema';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get nodeEnv() {
    return this.config.get('NODE_ENV', { infer: true });
  }

  get port() {
    return this.config.get('PORT', { infer: true });
  }

  get corsOrigin() {
    return this.config.get('CORS_ORIGIN', { infer: true });
  }

  get postgres() {
    return {
      host: this.config.get('POSTGRES_HOST', { infer: true }),
      port: this.config.get('POSTGRES_PORT', { infer: true }),
      user: this.config.get('POSTGRES_USER', { infer: true }),
      password: this.config.get('POSTGRES_PASSWORD', { infer: true }),
      database: this.config.get('POSTGRES_DB', { infer: true }),
    };
  }

  get anthropic() {
    return {
      apiKey: this.config.get('ANTHROPIC_API_KEY', { infer: true }),
      model: this.config.get('ANTHROPIC_MODEL', { infer: true }),
      maxTokens: this.config.get('ANTHROPIC_MAX_TOKENS', { infer: true }),
    };
  }

  get kafka() {
    return {
      brokers: this.config
        .get('KAFKA_BROKERS', { infer: true })
        .split(',')
        .map((b) => b.trim()),
      clientId: this.config.get('KAFKA_CLIENT_ID', { infer: true }),
      groupId: this.config.get('KAFKA_GROUP_ID', { infer: true }),
      schemaRegistryUrl: this.config.get('SCHEMA_REGISTRY_URL', {
        infer: true,
      }),
    };
  }
}
