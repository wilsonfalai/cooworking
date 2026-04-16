"use client"

import { useEffect, useState, useMemo } from "react"
import { use } from "react"
import Link from "next/link"
import {
  Building2,
  MapPin,
  Users,
  Clock,
  Pencil,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react"
import { type ColumnDef } from "@tanstack/react-table"

import { useAuth } from "@/contexts/auth-context"
import { getToken } from "@/lib/auth"
import { api, type Organization, type Location, type Member, type MemberRole } from "@/lib/api"
import { ApiError } from "@/lib/api"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { DataTable } from "@/components/ui/data-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─── Types ────────────────────────────────────────────────────────────────────

type GroupedMember = {
  userId: string
  user: Pick<Member["user"], "id" | "name" | "email">
  roles: MemberRole[]
  locations: Location[]
}

// ─── Status config ────────────────────────────────────────────────────────────

const orgStatusConfig = {
  ACTIVE:    { label: "Ativo",    variant: "default" as const,     icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  TRIAL:     { label: "Trial",    variant: "secondary" as const,   icon: <AlertCircle className="h-3.5 w-3.5" /> },
  SUSPENDED: { label: "Suspenso", variant: "destructive" as const, icon: <XCircle className="h-3.5 w-3.5" /> },
}

const locationStatusConfig = {
  ACTIVE:   { label: "Ativo",   variant: "default" as const },
  INACTIVE: { label: "Inativo", variant: "secondary" as const },
}

const memberRoleLabel: Record<MemberRole, string> = {
  OWNER:  "Proprietário",
  ADMIN:  "Administrador",
  STAFF:  "Colaborador",
  MEMBER: "Membro",
}

// ─── Location columns ─────────────────────────────────────────────────────────

function buildLocationColumns(orgId: string): ColumnDef<Location>[] {
  return [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <Link
            href={`/organizations/${orgId}/locations/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        </div>
      ),
    },
    {
      accessorKey: "city",
      header: "Cidade",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.city ?? "—"}{row.original.state ? `, ${row.original.state}` : ""}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const cfg = locationStatusConfig[row.original.status]
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>
      },
    },
  ]
}

// ─── Grouped member columns ───────────────────────────────────────────────────

function buildMemberColumns(orgId: string): ColumnDef<GroupedMember>[] {
  return [
    {
      accessorKey: "user",
      header: "Usuário",
      cell: ({ row }) => {
        const { name, email } = row.original.user
        const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
        )
      },
    },
    {
      id: "roles",
      header: "Funções",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {[...new Set(row.original.roles)].map((role) => (
            <Badge key={role} variant="outline" className="text-xs">
              {memberRoleLabel[role]}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: "locations",
      header: "Unidades vinculadas",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.locations.map((loc) => (
            <span
              key={loc.id}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              <MapPin className="h-2.5 w-2.5" />
              {loc.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href={`/users/${row.original.userId}`} />}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Visualizar usuário
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  description,
  icon,
  loading,
}: {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  loading?: boolean
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      {loading ? (
        <Skeleton className="mt-1 h-7 w-12" />
      ) : (
        <p className="text-2xl font-bold">{value}</p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

// ─── Member section ───────────────────────────────────────────────────────────

function MemberSection({
  title,
  description,
  data,
  columns,
  isLoading,
  emptyMessage,
}: {
  title: string
  description: string
  data: GroupedMember[]
  columns: ColumnDef<GroupedMember>[]
  isLoading: boolean
  emptyMessage: string
}) {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Separator />
      <div className="p-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <DataTable columns={columns} data={data} searchColumn="user" searchPlaceholder="Buscar por nome..." />
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { user, loading: authLoading } = useAuth()

  const [org, setOrg] = useState<Organization | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorStatus, setErrorStatus] = useState<number | null>(null)

  useEffect(() => {
    if (authLoading || !user) return
    const token = getToken()
    if (!token) return

    Promise.all([
      api.organizations.get(token, id),
      api.members.list(token, id),
    ])
      .then(([orgData, membersData]) => {
        setOrg(orgData)
        setMembers(membersData)
      })
      .catch((err: unknown) => {
        setErrorStatus(err instanceof ApiError ? err.status : 500)
      })
      .finally(() => setIsLoading(false))
  }, [authLoading, user, id])

  // ── Grouped members ──
  const { collaborators, clients } = useMemo(() => {
    const map = new Map<string, GroupedMember>()

    for (const member of members) {
      const existing = map.get(member.userId)
      if (existing) {
        existing.roles.push(member.role)
        if (member.location) existing.locations.push(member.location)
      } else {
        map.set(member.userId, {
          userId: member.userId,
          user: member.user,
          roles: [member.role],
          locations: member.location ? [member.location] : [],
        })
      }
    }

    const grouped = Array.from(map.values())
    const collaboratorRoles: MemberRole[] = ["OWNER", "ADMIN", "STAFF"]

    return {
      collaborators: grouped.filter((g) => g.roles.some((r) => collaboratorRoles.includes(r))),
      clients: grouped.filter((g) => g.roles.every((r) => r === "MEMBER")),
    }
  }, [members])

  const memberColumns = useMemo(() => buildMemberColumns(id), [id])
  const locationColumns = useMemo(() => buildLocationColumns(id), [id])

  const locations = org?.locations ?? []
  const activeMembers = members.filter((m) => m.status === "ACTIVE").length
  const pendingMembers = members.filter((m) => m.status === "PENDING").length

  const myMemberRole = useMemo(() => {
    if (!user || user.role === "PLATFORM_ADMIN") return null
    return members.find((m) => m.userId === user.id)?.role ?? null
  }, [members, user])

  const canSeeCollaborators =
    user?.role === "PLATFORM_ADMIN" || myMemberRole === "OWNER"

  if (errorStatus === 403) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <XCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">403 — Acesso negado</p>
          <h2 className="mt-1 text-xl font-semibold">Você não tem acesso a esta organização</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta organização não está vinculada à sua conta.
          </p>
        </div>
        <Link href="/dashboard" className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground">
          Voltar ao Dashboard
        </Link>
      </div>
    )
  }

  if (errorStatus) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Erro ao carregar organização ({errorStatus}).
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {user?.role === "PLATFORM_ADMIN" ? (
          <Link href="/organizations" className="hover:text-foreground transition-colors">
            Organizações
          </Link>
        ) : (
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        {isLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <span className="text-foreground font-medium">{org?.name}</span>
        )}
      </nav>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border bg-muted">
            {org?.logo ? (
              <img src={org.logo} alt={org.name} className="h-14 w-14 rounded-xl object-cover" />
            ) : (
              <Building2 className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div>
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-48" />
                <Skeleton className="mt-1.5 h-4 w-32" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-semibold tracking-tight">{org?.name}</h1>
                  {org && (
                    <Badge variant={orgStatusConfig[org.status].variant} className="flex items-center gap-1">
                      {orgStatusConfig[org.status].icon}
                      {orgStatusConfig[org.status].label}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 font-mono text-sm text-muted-foreground">/{org?.slug}</p>
              </>
            )}
          </div>
        </div>

        <Button variant="outline" size="sm" disabled={isLoading}>
          <Link href={`/organizations/${id}/edit`} className="flex items-center gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Link>
        </Button>
      </div>

      <Separator />

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Unidades"
          value={locations.length}
          description="Locais cadastrados"
          icon={<MapPin className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Colaboradores"
          value={collaborators.length}
          description="Funcionários ativos"
          icon={<Users className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Clientes"
          value={clients.length}
          description="Membros cadastrados"
          icon={<Users className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Criado em"
          value={
            org
              ? new Date(org.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"
          }
          description="Data de cadastro"
          icon={<Clock className="h-4 w-4" />}
          loading={isLoading}
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Left ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Unidades */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="px-5 py-4">
              <h2 className="font-semibold">Unidades</h2>
              <p className="text-sm text-muted-foreground">Locais vinculados a esta organização</p>
            </div>
            <Separator />
            <div className="p-5">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : locations.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma unidade cadastrada ainda.
                </p>
              ) : (
                <DataTable columns={locationColumns} data={locations} />
              )}
            </div>
          </div>

          {/* Colaboradores — visível apenas para PLATFORM_ADMIN e OWNER */}
          {canSeeCollaborators && (
            <MemberSection
              title="Colaboradores"
              description="Proprietários, administradores e staff da organização"
              data={collaborators}
              columns={memberColumns}
              isLoading={isLoading}
              emptyMessage="Nenhum colaborador cadastrado."
            />
          )}

          {/* Clientes */}
          <MemberSection
            title="Clientes"
            description="Membros com acesso aos espaços de coworking"
            data={clients}
            columns={memberColumns}
            isLoading={isLoading}
            emptyMessage="Nenhum cliente cadastrado."
          />
        </div>

        {/* ── Right: Notes ── */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="px-5 py-4">
              <h2 className="font-semibold">Notas e observações</h2>
              <p className="text-sm text-muted-foreground">Anotações internas sobre esta organização</p>
            </div>
            <Separator />
            <div className="flex flex-col gap-3 p-5">
              <div className="rounded-lg border border-dashed bg-muted/40 p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Em breve</p>
                <p className="text-sm text-muted-foreground">
                  Esta área será usada para registrar notas internas, observações de suporte e histórico de contato com a organização.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
