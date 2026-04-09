# Tasks: Scalar API Documentation

**Input**: `001-scalar-api-docs.md` (spec), `001-scalar-api-docs-plan.md` (plan)

## Phase 1: Setup

- [x] T001 Instalar `@nestjs/swagger` e `@scalar/nestjs-api-reference` em `apps/api`

## Phase 2: US1+US2 — Documentação e teste de endpoints (P1)

**Goal**: Interface Scalar funcional em `/api/docs` com todos os endpoints documentados e testáveis.

- [x] T002 Configurar SwaggerModule + Scalar no `apps/api/src/main.ts`
- [x] T003 [P] Decorar `auth.controller.ts` com `@ApiTags('Auth')`
- [x] T004 [P] Decorar `organizations.controller.ts` com `@ApiTags('Organizations')` e `@ApiBearerAuth()`
- [x] T005 [P] Decorar `locations.controller.ts` com `@ApiTags('Locations')` e `@ApiBearerAuth()`
- [x] T006 [P] Decorar `members.controller.ts` com `@ApiTags('Members')` e `@ApiBearerAuth()`
- [x] T007 [P] Decorar DTOs de auth (`register.dto.ts`, `login.dto.ts`) com `@ApiProperty()`
- [x] T008 [P] Decorar DTOs de organizations (`create-organization.dto.ts`, `update-organization.dto.ts`)
- [x] T009 [P] Decorar DTOs de locations (`create-location.dto.ts`, `update-location.dto.ts`)
- [x] T010 [P] Decorar DTOs de members (`create-member.dto.ts`, `update-member.dto.ts`)

**Checkpoint**: Acessar `http://localhost:3001/api/docs` → ver todos os endpoints agrupados → testar login e endpoint protegido.

## Phase 3: US3 — Proteção em produção (P2)

- [x] T011 Condicionar setup do Swagger/Scalar a `NODE_ENV !== 'production'` em `main.ts`

**Checkpoint**: Com `NODE_ENV=production`, rota `/api/docs` retorna 404.

## Phase 4: Review

- [x] T012 Verificar SC-001: todos os endpoints aparecem na documentação
- [x] T013 Verificar SC-002: testar endpoint autenticado via Scalar UI
- [x] T014 Verificar SC-003: rota não acessível em produção
- [x] T015 Commit final
