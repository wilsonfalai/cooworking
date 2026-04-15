"use client"

import { useEffect, useState } from "react"
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
} from "lucide-react"
import { type ColumnDef } from "@tanstack/react-table"

import { useAuth } from "@/contexts/auth-context"
import { getToken } from "@/lib/auth"
import { api, type Organization, type Location, type Member } from "@/lib/api"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { DataTable } from "@/components/ui/data-table"

// ─── Status config ────────────────────────────────────────────────────────────

const orgStatusConfig = {
  ACTIVE:    { label: "Ativo",    variant: "default" as const,      icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  TRIAL:     { label: "Trial",    variant: "secondary" as const,    icon: <AlertCircle className="h-3.5 w-3.5" /> },
  SUSPENDED: { label: "Suspenso", variant: "destructive" as const,  icon: <XCircle className="h-3.5 w-3.5" /> },
}

const locationStatusConfig = {
  ACTIVE:   { label: "Ativo",   variant: "default" as const },
  INACTIVE: { label: "Inativo", variant: "secondary" as const },
}

const memberRoleConfig: Record<string, string> = {
  OWNER:  "Proprietário",
  ADMIN:  "Administrador",
  STAFF:  "Colaborador",
  MEMBER: "Membro",
}

// ─── Location columns ─────────────────────────────────────────────────────────

const locationColumns: ColumnDef<Location>[] = [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="font-medium">{row.original.name}</span>
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
  const [error, setError] = useState("")

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
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [authLoading, user, id])

  // ── Error ──
  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      </div>
    )
  }

  const locations = org?.locations ?? []
  const activeMembers = members.filter((m) => m.status === "ACTIVE").length
  const pendingMembers = members.filter((m) => m.status === "PENDING").length

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/organizations" className="hover:text-foreground transition-colors">
          Organizações
        </Link>
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
                    <Badge
                      variant={orgStatusConfig[org.status].variant}
                      className="flex items-center gap-1"
                    >
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
          title="Membros ativos"
          value={activeMembers}
          description="Com acesso liberado"
          icon={<Users className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Pendentes"
          value={pendingMembers}
          description="Aguardando aprovação"
          icon={<Clock className="h-4 w-4" />}
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

        {/* ── Left: Locations + Members ── */}
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

          {/* Membros */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="px-5 py-4">
              <h2 className="font-semibold">Membros</h2>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Carregando..." : `${members.length} vínculo${members.length !== 1 ? "s" : ""} na organização`}
              </p>
            </div>
            <Separator />
            <div className="divide-y">
              {isLoading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : members.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum membro cadastrado.
                </p>
              ) : (
                members.slice(0, 8).map((member) => {
                  const initials = member.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()

                  return (
                    <div key={member.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{member.user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {memberRoleConfig[member.role] ?? member.role}
                      </Badge>
                    </div>
                  )
                })
              )}
            </div>
            {members.length > 8 && (
              <>
                <Separator />
                <div className="px-5 py-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    +{members.length - 8} membros não exibidos
                  </p>
                </div>
              </>
            )}
          </div>
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
