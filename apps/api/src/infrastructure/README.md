# infrastructure

Adapters that implement `domain/ports/*`. External-world concerns live here:

- `persistence/` — MikroORM entities, repositories, migrations
- `llm/` — Anthropic client adapter implementing `LlmPort`
- `messaging/` — Kafka producer/consumer, implementing `EventPublisherPort`

Rule: `infrastructure` may import from `domain` and `application`. Never from `api`.
