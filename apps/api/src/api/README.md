# api

HTTP surface. NestJS controllers, DTOs, guards, interceptors, exception filters.
Thin — delegates work to application use cases.

Rule: `api` imports from `application` (and `domain` types). Never from `infrastructure`.
