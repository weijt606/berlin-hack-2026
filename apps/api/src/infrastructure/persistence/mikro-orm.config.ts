import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/postgresql';
import 'dotenv/config';

export default defineConfig({
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? 'postgres',
  dbName: process.env.POSTGRES_DB ?? 'procurement',
  entities: ['dist/apps/api/infrastructure/persistence/entities/*.js'],
  entitiesTs: ['apps/api/src/infrastructure/persistence/entities/*.ts'],
  extensions: [Migrator],
  migrations: {
    path: 'apps/api/src/infrastructure/persistence/migrations',
    pathTs: 'apps/api/src/infrastructure/persistence/migrations',
    emit: 'ts',
  },
  debug: process.env.NODE_ENV !== 'production',
});
