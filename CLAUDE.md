# Cooworking SaaS

Monorepo Turborepo para uma plataforma SaaS de coworking.

## Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend (Web)**: Next.js (App Router) + Tailwind CSS v4 + Shadcn UI — `apps/web` (porta 3000)
- **Frontend (Admin)**: Next.js (App Router) + Tailwind CSS v4 + Shadcn UI — `apps/admin` (porta 3002)
- **Backend**: NestJS (ESM, `"type": "module"`) + Prisma 7 + PostgreSQL — `apps/api` (porta 3001)
- **Auth**: NestJS nativo (Passport + JWT) — sem plugins externos como better-auth
- **DB**: PostgreSQL na nuvem (EasyPanel), database `mosaic`, schema `cooworking2`
- **Storage**: MinIO (S3-compatible) para arquivos estáticos
- **Spec Kit**: Spec-Driven Development — `.specify/` e `.claude/skills/`

## Comandos

```bash
pnpm dev          # Inicia front + back em paralelo
pnpm build        # Build de produção
pnpm lint         # Lint em todos os projetos

# Prisma (executar de dentro de apps/api)
pnpm prisma:generate   # Gera o client Prisma
pnpm prisma:migrate    # Cria e aplica migrations
pnpm prisma:push       # Push schema direto (dev)
pnpm prisma:studio     # UI para explorar dados
```

## Estrutura

```
apps/
  admin/          # Next.js SaaS admin panel (porta 3002)
  web/            # Next.js coworking frontend (porta 3000)
  api/            # NestJS backend (ESM)
    prisma/       # Schema e migrations
    prisma.config.ts  # Config de conexão (Prisma 7)
    src/
      generated/  # Prisma client gerado (gitignored)
      auth/       # Autenticação (JWT + Passport)
      users/      # Módulo de usuários
      storage/    # MinIO storage service
      prisma/     # PrismaService (global)
packages/
  tsconfig/       # Configurações TypeScript compartilhadas
.specify/         # Spec Kit (SDD)
```

## Convenções

- Linguagem do código: inglês
- Commits: Conventional Commits
- Backend API prefix: `/api`
- Frontend consome API via `NEXT_PUBLIC_API_URL`
- Backend é ESM — todos os imports locais usam extensão `.js`
- Prisma 7 — client gerado em `src/generated/prisma`, conexão via adapter em `PrismaService`
