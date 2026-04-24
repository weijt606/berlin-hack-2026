# domain

Pure business logic. No framework, no Nest decorators, no ORM, no I/O.

- `entities/` — rich domain objects with behavior and invariants
- `value-objects/` — immutable values (Money, Email, SKU, ...)
- `ports/` — interfaces the domain needs from the outside world (e.g. `LlmPort`,
  `EventPublisherPort`). Adapters live in `infrastructure/`.

Rule: `domain` **imports nothing** from `application`, `infrastructure`, or `api`.
