import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Migrator } from '@mikro-orm/migrations';
import { Module } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';

@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) =>
        defineConfig({
          driver: PostgreSqlDriver,
          host: config.postgres.host,
          port: config.postgres.port,
          user: config.postgres.user,
          password: config.postgres.password,
          dbName: config.postgres.database,
          entities: ['dist/apps/api/infrastructure/persistence/entities/*.js'],
          entitiesTs: ['apps/api/src/infrastructure/persistence/entities/*.ts'],
          extensions: [Migrator],
          debug: config.nodeEnv !== 'production',
        }),
    }),
  ],
  exports: [MikroOrmModule],
})
export class PersistenceModule {}
