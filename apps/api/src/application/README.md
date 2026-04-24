# application

Use cases that orchestrate the domain. Thin services that:

- receive a command/query,
- call domain entities and ports,
- return a result DTO.

Rule: `application` imports **only from `domain`**. Never from `infrastructure` or `api`.
