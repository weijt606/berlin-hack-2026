# Procurement AI — Hackathon Template

An Nx monorepo template with a NestJS API (clean architecture), React + Vite web,
MikroORM on Postgres, Kafka, and an Anthropic adapter wired behind a domain port.

## Stack

| Layer      | Tech                                                       |
| ---------- | ---------------------------------------------------------- |
| Monorepo   | Nx 22                                                      |
| API        | NestJS 11, MikroORM 6, `@anthropic-ai/sdk`, Zod env schema |
| Web        | React 19, Vite, Tailwind v4, shadcn/ui, React Router       |
| Data / bus | Postgres 17.4, Kafka 7.9 (Confluent), Karapace, Kafka UI   |
| Tooling    | ESLint (+ layer boundaries), Prettier, Jest, Vitest        |

## Layout

```
apps/
  api/                          NestJS app
    src/
      config/                   typed ConfigService + Zod env schema
      domain/                   entities, value-objects, ports (framework-free)
      application/              use cases (depend only on domain)
      infrastructure/           adapters implementing domain ports
        persistence/            MikroORM entities, repos, migrations
        llm/                    Anthropic adapter → LlmPort
        messaging/              (Kafka producer/consumer)
      api/                      HTTP controllers, DTOs
      app.module.ts
      main.ts
  web/                          React + Vite + Tailwind + shadcn
libs/
  shared-types/                 API contracts shared between api and web
docker/
  docker-compose.yml            postgres + zookeeper + kafka + karapace + kafka-ui
.env.example
```

## Clean-architecture dependency rules

Enforced by `apps/api/eslint.config.mjs`:

```
domain         → (nothing — framework-free)
application    → domain
infrastructure → domain, application
api            → application, domain (types only)
```

Run `nx lint @procurement-ai/api` to check.

## Getting started

```bash
# 1. Install
npm install

# 2. Start services
cp .env.example .env
# fill in ANTHROPIC_API_KEY
npm run docker:up

# 3. Run
npm run dev:api     # http://localhost:3000/api
npm run dev:web     # http://localhost:4200
```

`dev:web` proxies `/api/*` to the NestJS server, so `fetch('/api/health')` from the
browser works out of the box.

## Useful commands

| Command                      | What it does                           |
| ---------------------------- | -------------------------------------- |
| `npm run dev:api`            | Nest in watch mode                     |
| `npm run dev:web`            | Vite dev server                        |
| `npm run build`              | Build every project                    |
| `npm run lint`               | Lint every project (incl. layer rules) |
| `npm run typecheck`          | `tsc --build` for every project        |
| `npm run test`               | Run all unit tests                     |
| `npm run docker:up` / `down` | Start / stop the local stack           |
| `npx nx graph`               | Interactive dependency graph           |

## Adding a shadcn component

`components.json` already lives in `apps/web`. From the repo root:

```bash
npx shadcn@latest add dialog --cwd apps/web
```

## Adding a MikroORM entity

1. Create the class under `apps/api/src/infrastructure/persistence/entities/`
2. `npx mikro-orm migration:create` (CLI config is `apps/api/src/infrastructure/persistence/mikro-orm.config.ts`)
3. Repositories go next to the entities; keep domain entities pure and translate in the repo.

## Using the LLM port

```ts
import { LLM_PORT, LlmPort } from '../../domain/ports/llm.port';

@Injectable()
export class DraftPurchaseOrder {
  constructor(@Inject(LLM_PORT) private readonly llm: LlmPort) {}

  async run(prompt: string) {
    const result = await this.llm.complete({
      messages: [{ role: 'user', content: prompt }],
    });
    return result.text;
  }
}
```

Swap `AnthropicAdapter` for another provider by binding a different class to `LLM_PORT`
in `infrastructure/llm/llm.module.ts` — application code doesn't change.

## Hackathon notes

- On 2026-04-22 at 09:00 you receive a codebase zip. This template is for **practice**,
  not the final entry. Use it to warm up with the stack the day before.
- Docker images used here match the ones the hackathon instructions pre-pull, so the
  first `docker compose up` is instant on hackathon day.
