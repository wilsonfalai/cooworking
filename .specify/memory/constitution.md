<!--
  Sync Impact Report
  Version change: 0.0.0 → 1.0.0
  Added principles:
    - I. Multi-Tenant by Design
    - II. API-First
    - III. Auth-Compatible Schema
    - IV. Spec-Driven Development
    - V. Simplicity & Incremental Delivery
  Added sections:
    - Technical Constraints
    - Development Workflow
    - Governance
  Removed sections: none
  Templates requiring updates:
    - plan-template.md ✅ (no changes needed — generic structure aligns)
    - spec-template.md ✅ (no changes needed — user story format aligns)
    - tasks-template.md ✅ (no changes needed — phased approach aligns)
  Follow-up TODOs: none
-->

# Cooworking SaaS Constitution

## Core Principles

### I. Multi-Tenant by Design

Every feature MUST be designed for multi-tenancy from the start.
Data isolation between tenants (coworking spaces) is non-negotiable.

- All database queries MUST be scoped to the authenticated tenant context.
- Shared infrastructure (database, storage) MUST enforce logical separation.
- The PostgreSQL schema `cooworking2` is the single source of truth for all tenant data.
- MinIO bucket `cooworking` stores all static files with tenant-prefixed paths.

### II. API-First

The backend (NestJS) exposes a RESTful API that the frontend (Next.js) consumes.
No business logic lives in the frontend — it is a presentation layer.

- All endpoints MUST be prefixed with `/api`.
- Every endpoint MUST validate input using `class-validator` DTOs.
- Responses MUST follow a consistent structure (data, error, status).
- CORS MUST be configured to allow only the designated frontend origin.

### III. Auth-Compatible Schema

Authentication uses NestJS native (Passport + JWT) with a database schema
compatible with better-auth conventions.

- The `user`, `account`, `session`, and `verification` tables MUST follow
  the better-auth structure for future compatibility.
- Passwords are stored in the `account` table with `providerId: "credential"`,
  hashed with bcrypt (cost factor 12).
- JWT tokens are the sole mechanism for API authentication.
- No external auth plugins (e.g., better-auth, NextAuth) — auth is implemented
  natively in NestJS.

### IV. Spec-Driven Development

Every feature MUST begin as a specification before implementation.
The Spec Kit workflow (`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`) is the standard development process.

- Specifications define WHAT to build (business outcomes, user scenarios).
- Plans define HOW to build (technical approach, architecture decisions).
- Tasks break plans into actionable, independently completable items.
- No implementation work begins without an approved spec and plan.

### V. Simplicity & Incremental Delivery

Build only what is needed now. Deliver value in small, testable increments.

- YAGNI: do not add features or abstractions for hypothetical future needs.
- Each user story MUST be independently deployable and testable.
- Prefer simple, readable code over clever or over-engineered solutions.
- The monorepo (Turborepo + pnpm) keeps frontend and backend in sync
  without premature microservice splits.

## Technical Constraints

- **Monorepo**: Turborepo + pnpm workspaces. `apps/web` (Next.js), `apps/api` (NestJS).
- **Backend**: NestJS with ESM (`"type": "module"`). All local imports use `.js` extension.
- **ORM**: Prisma 7. Client generated at `src/generated/prisma`. Connection via `@prisma/adapter-pg`.
- **Database**: PostgreSQL (EasyPanel), database `mosaic`, schema `cooworking2`.
- **Storage**: MinIO (S3-compatible) via `minio` npm package.
- **Frontend**: Next.js (App Router) + Tailwind CSS v4 + Shadcn UI.
- **Language**: Code in English. Documentation and user-facing content in Portuguese (pt-BR).
- **Commits**: Conventional Commits format.

## Development Workflow

1. **Spec**: Define the feature using `/speckit-specify`. Capture user scenarios and acceptance criteria.
2. **Clarify** (optional): Use `/speckit-clarify` to resolve ambiguities.
3. **Plan**: Create the technical plan using `/speckit-plan`. Validate against this constitution.
4. **Tasks**: Break down into tasks using `/speckit-tasks`.
5. **Implement**: Execute tasks using `/speckit-implement` or manual development.
6. **Review**: Verify implementation against spec acceptance criteria.
7. **Commit**: Use Conventional Commits. One logical change per commit.

## Governance

- This constitution supersedes all ad-hoc practices. When in doubt, refer here.
- Amendments require documentation of what changed, why, and impact on existing specs.
- Constitution version follows semantic versioning (MAJOR.MINOR.PATCH).
- All new features MUST pass a Constitution Check during the planning phase.

**Version**: 1.0.0 | **Ratified**: 2026-04-09 | **Last Amended**: 2026-04-09
