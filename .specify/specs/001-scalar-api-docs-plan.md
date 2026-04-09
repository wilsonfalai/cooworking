# Implementation Plan: Scalar API Documentation

**Branch**: `001-scalar-api-docs` | **Date**: 2026-04-09 | **Spec**: [001-scalar-api-docs.md](001-scalar-api-docs.md)

## Summary

Instalar `@nestjs/swagger` + `@scalar/nestjs-api-reference` no backend NestJS para gerar documentação OpenAPI interativa em `/api/docs`. Acesso restrito a ambiente de desenvolvimento. DTOs existentes serão decorados com metadata do Swagger para documentação automática.

## Technical Context

**Language/Version**: TypeScript 5, Node 20+, NestJS 11 (ESM)
**Primary Dependencies**: `@nestjs/swagger`, `@scalar/nestjs-api-reference`
**Target Platform**: Backend NestJS (`apps/api`)
**Constraints**: Deve funcionar com ESM (`"type": "module"`), não expor em produção

## Constitution Check

| Princípio | Status | Nota |
|-----------|--------|------|
| I. Multi-Tenant | ✅ N/A | Docs é ferramenta interna, não toca dados de tenant |
| II. API-First | ✅ Pass | Documenta a API existente, reforça o princípio |
| III. Auth-Compatible | ✅ Pass | Swagger suporta Bearer JWT no UI |
| IV. Spec-Driven | ✅ Pass | Esta spec é a prova |
| V. Simplicidade | ✅ Pass | 2 dependências, configuração mínima no main.ts |

## Implementation Phases

### Phase 1 — Instalar dependências

```bash
cd apps/api && pnpm add @nestjs/swagger @scalar/nestjs-api-reference
```

### Phase 2 — Configurar Swagger + Scalar no main.ts

**Arquivo**: `apps/api/src/main.ts`

1. Importar `SwaggerModule`, `DocumentBuilder` do `@nestjs/swagger`
2. Importar `apiReference` do `@scalar/nestjs-api-reference`
3. Configurar o DocumentBuilder com título, versão, Bearer auth
4. Gerar o documento OpenAPI via `SwaggerModule.createDocument()`
5. Montar o Scalar UI na rota `/api/docs`
6. Condicionar ao `NODE_ENV !== 'production'`

```typescript
if (process.env.NODE_ENV !== 'production') {
  const config = new DocumentBuilder()
    .setTitle('Cooworking API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  app.use('/api/docs', apiReference({ spec: { content: document } }));
}
```

### Phase 3 — Decorar controllers com tags

Adicionar `@ApiTags('tag')` em cada controller para agrupar endpoints:

| Controller | Tag |
|-----------|-----|
| `auth.controller.ts` | `Auth` |
| `organizations.controller.ts` | `Organizations` |
| `locations.controller.ts` | `Locations` |
| `members.controller.ts` | `Members` |

Adicionar `@ApiBearerAuth()` nos controllers protegidos por JWT.

### Phase 4 — Decorar DTOs com ApiProperty

Adicionar `@ApiProperty()` e `@ApiPropertyOptional()` nos DTOs existentes para documentar campos:

| DTO | Campos |
|-----|--------|
| `RegisterDto` | email, name, password |
| `LoginDto` | email, password |
| `CreateOrganizationDto` | name, slug?, logo? |
| `UpdateOrganizationDto` | name?, slug?, logo?, status? |
| `CreateLocationDto` | name, slug?, address?, city?, state?, country?, zipCode?, phone?, timezone? |
| `UpdateLocationDto` | (todos optional + status?) |
| `CreateMemberDto` | userId, locationId, role? |
| `UpdateMemberDto` | role?, status? |

O plugin `@nestjs/swagger` com `plugin` no nest-cli.json pode auto-detectar DTOs do class-validator, mas com ESM pode ter incompatibilidades. Usar decorators explícitos é mais seguro.

### Phase 5 — Verificação

1. `pnpm build` — compilação sem erros
2. `pnpm start:dev` — servidor inicia
3. Acessar `http://localhost:3001/api/docs` — Scalar UI renderiza
4. Verificar que todos os 4 grupos de endpoints aparecem (Auth, Organizations, Locations, Members)
5. Testar `POST /api/auth/login` pela interface — receber token
6. Configurar Bearer token no Scalar — testar endpoint protegido
7. Verificar `NODE_ENV=production` — rota `/api/docs` retorna 404

## Source Code (arquivos impactados)

```
apps/api/
  src/
    main.ts                                    ← editar (setup Swagger + Scalar)
    auth/auth.controller.ts                    ← editar (ApiTags, ApiBearerAuth)
    auth/dto/register.dto.ts                   ← editar (ApiProperty)
    auth/dto/login.dto.ts                      ← editar (ApiProperty)
    organizations/organizations.controller.ts  ← editar (ApiTags, ApiBearerAuth)
    organizations/dto/create-organization.dto.ts ← editar (ApiProperty)
    organizations/dto/update-organization.dto.ts ← editar (ApiProperty)
    locations/locations.controller.ts          ← editar (ApiTags, ApiBearerAuth)
    locations/dto/create-location.dto.ts       ← editar (ApiProperty)
    locations/dto/update-location.dto.ts       ← editar (ApiProperty)
    members/members.controller.ts              ← editar (ApiTags, ApiBearerAuth)
    members/dto/create-member.dto.ts           ← editar (ApiProperty)
    members/dto/update-member.dto.ts           ← editar (ApiProperty)
```
