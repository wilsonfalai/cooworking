<!--
  Sync Impact Report
  Version change: 1.0.0 → 2.0.0
  Added sections:
    - Domain Model (Phase 0)
    - Architectural Decisions
    - Frontend Architecture
  Updated sections:
    - Technical Constraints (added apps/admin, migrations, Member model)
    - Multi-Tenant by Design (added Organization → Location → Member hierarchy)
    - Auth-Compatible Schema (added User.role for platform level)
    - Development Workflow (added Phase 0 note)
  Templates requiring updates:
    - plan-template.md ✅ (no changes needed)
    - spec-template.md ✅ (no changes needed)
    - tasks-template.md ✅ (no changes needed)
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
- Tenant hierarchy: **Organization** (SaaS client) → **Location** (physical branch) → **Member** (user access).
- A single Organization can have 1..N Locations.
- User access is scoped per Location via the Member table — one record per user per location.

### II. API-First

The backend (NestJS) exposes a RESTful API that the frontend (Next.js) consumes.
No business logic lives in the frontend — it is a presentation layer.

- All endpoints MUST be prefixed with `/api`.
- Every endpoint MUST validate input using `class-validator` DTOs.
- Responses MUST follow a consistent structure (data, error, status).
- CORS MUST be configured to allow only the designated frontend origin.
- Nested resources use nested routes: `/api/organizations/:orgId/locations`, `/api/organizations/:orgId/members`.

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
- Platform-level access: `User.role` field (`PLATFORM_ADMIN | USER`).
- Organization-level access: `Member` table with role hierarchy (`OWNER > ADMIN > STAFF > MEMBER`).

### IV. Spec-Driven Development

Every feature MUST begin as a specification before implementation.
The Spec Kit workflow (`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`) is the standard development process.

- Specifications define WHAT to build (business outcomes, user scenarios).
- Plans define HOW to build (technical approach, architecture decisions).
- Tasks break plans into actionable, independently completable items.
- No implementation work begins without an approved spec and plan.
- Phase 0 (foundation) was built pre-SDD; all future features follow this workflow.

### V. Simplicity & Incremental Delivery

Build only what is needed now. Deliver value in small, testable increments.

- YAGNI: do not add features or abstractions for hypothetical future needs.
- Each user story MUST be independently deployable and testable.
- Prefer simple, readable code over clever or over-engineered solutions.
- The monorepo (Turborepo + pnpm) keeps frontend and backend in sync
  without premature microservice splits.

## Domain Model (Phase 0 — Implemented)

Foundational models built pre-SDD. These are the base for all future features.

```
User (auth entity)
  ├── role: PLATFORM_ADMIN | USER
  ├── Account[] (auth providers, passwords)
  ├── Session[] (active sessions)
  └── Member[] (organization/location access)

Organization (SaaS tenant — the coworking company)
  ├── name, slug (unique, used for subdomain routing)
  ├── status: TRIAL | ACTIVE | SUSPENDED
  ├── Location[] (physical branches)
  └── Member[] (all users linked to this org)

Location (physical coworking unit)
  ├── organizationId → Organization
  ├── name, slug (unique within org)
  ├── address, city, state, country, zipCode, phone, timezone
  ├── status: ACTIVE | INACTIVE
  └── Member[] (users with access to this location)

Member (better-auth inspired — links User to Location)
  ├── userId → User
  ├── organizationId → Organization
  ├── locationId → Location
  ├── role: OWNER | ADMIN | STAFF | MEMBER
  ├── status: ACTIVE | INACTIVE | SUSPENDED | PENDING
  └── @@unique([userId, locationId])
```

### Role Hierarchy

| Level | Role | Scope | Purpose |
|-------|------|-------|---------|
| Platform | PLATFORM_ADMIN | All organizations | SaaS admin (owner's team) |
| Platform | USER | Via Member records | Regular user |
| Organization | OWNER | All locations in org | Coworking owner |
| Organization | ADMIN | All locations in org | Co-manager |
| Location | STAFF | Specific location | Receptionist, operator |
| Location | MEMBER | Specific location | Coworking customer |

- Higher role implicitly includes lower role permissions (no multi-role needed).
- One Member record per user per location.
- OWNER/ADMIN members are auto-created when new Locations are added.

## Architectural Decisions

### Frontend Split

Two separate Next.js applications for distinct personas:

- **`apps/admin`** (port 3002): SaaS admin panel — manages organizations, plans, billing.
  URL: `app.{domain}.com`
- **`apps/web`** (port 3000): Coworking client — for coworking owners (admin routes) and members (member routes).
  URL: `{org-slug}.{domain}.com` or custom domain.

### Routing Model

- SaaS admin: `app.nomedosas.com`
- Coworking client: `{organization.slug}.nomedosas.com` or organization's custom domain.

### Slug Convention

- Organization: globally unique slug, used for subdomain routing.
- Location: unique within organization (`@@unique([organizationId, slug])`).
- Auto-generated from name via slugify (NFD normalize, remove accents, lowercase, hyphenate).

## Technical Constraints

- **Monorepo**: Turborepo + pnpm workspaces. `apps/web`, `apps/admin`, `apps/api`.
- **Backend**: NestJS with ESM (`"type": "module"`). All local imports use `.js` extension.
- **ORM**: Prisma 7. Client generated at `src/generated/prisma`. Connection via `@prisma/adapter-pg`.
- **Database**: PostgreSQL (EasyPanel), database `mosaic`, schema `cooworking2`. Managed via Prisma Migrate.
- **Storage**: MinIO (S3-compatible) via `minio` npm package.
- **Frontend**: Next.js (App Router) + Tailwind CSS v4 + Shadcn UI.
- **Language**: Code in English. Documentation and user-facing content in Portuguese (pt-BR).
- **Commits**: Conventional Commits format.
- **Ports**: web=3000, api=3001, admin=3002.

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

**Version**: 2.0.0 | **Ratified**: 2026-04-09 | **Last Amended**: 2026-04-09
