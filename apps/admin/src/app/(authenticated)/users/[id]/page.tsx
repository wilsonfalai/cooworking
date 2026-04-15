"use client"

import { useEffect, useState, useMemo } from "react"
import { use } from "react"
import Link from "next/link"
import {
  User as UserIcon,
  Mail,
  Shield,
  ShieldCheck,
  Clock,
  Building2,
  MapPin,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { type ColumnDef } from "@tanstack/react-table"

import { useAuth } from "@/contexts/auth-context"
import { getToken } from "@/lib/auth"
import { api, type UserDetail, type UserMembership, type MemberRole } from "@/lib/api"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { DataTable } from "@/components/ui/data-table"

// ─── Config ───────────────────────────────────────────────────────────────────

const memberRoleLabel: Record<MemberRole, string> = {
  OWNER:  "Proprietário",
  ADMIN:  "Administrador",
  STAFF:  "Colaborador",
  MEMBER: "Membro",
}

const memberRoleVariant: Record<MemberRole, "default" | "secondary" | "outline"> = {
  OWNER:  "default",
  ADMIN:  "default",
  STAFF:  "secondary",
  MEMBER: "outline",
}

const memberStatusConfig = {
  ACTIVE:    { label: "Ativo",      variant: "default" as const },
  INACTIVE:  { label: "Inativo",    variant: "secondary" as const },
  SUSPENDED: { label: "Suspenso",   variant: "destructive" as const },
  PENDING:   { label: "Pendente",   variant: "outline" as const },
}

// ─── Membership columns ───────────────────────────────────────────────────────

const membershipColumns: ColumnDef<UserMembership>[] = [
  {
    id: "organization",
    header: "Organização",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <Link
          href={`/organizations/${row.original.organization.id}`}
          className="font-medium hover:underline"
        >
          {row.original.organization.name}
        </Link>
      </div>
    ),
  },
  {
    id: "location",
    header: "Unidade",
    cell: ({ row }) => {
      const loc = row.original.location
      return (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="text-sm">
            {loc.name}{loc.city ? ` · ${loc.city}` : ""}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "role",
    header: "Função",
    cell: ({ row }) => (
      <Badge variant={memberRoleVariant[row.original.role]}>
        {memberRoleLabel[row.original.role]}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const cfg = memberStatusConfig[row.original.status]
      return <Badge variant={cfg.variant}>{cfg.label}</Badge>
    },
  },
  {
    accessorKey: "createdAt",
    header: "Desde",
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
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

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { user: authUser, loading: authLoading } = useAuth()

  const [user, setUser] = useState<UserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (authLoading || !authUser) return
    const token = getToken()
    if (!token) return

    api.users
      .get(token, id)
      .then(setUser)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [authLoading, authUser, id])

  const { orgsCount, activeCount } = useMemo(() => {
    if (!user) return { orgsCount: 0, activeCount: 0 }
    const uniqueOrgs = new Set(user.members.map((m) => m.organization.id))
    const active = user.members.filter((m) => m.status === "ACTIVE").length
    return { orgsCount: uniqueOrgs.size, activeCount: active }
  }, [user])

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? ""

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/users" className="hover:text-foreground transition-colors">
          Usuários
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        {isLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <span className="text-foreground font-medium">{user?.name}</span>
        )}
      </nav>

      {/* ── Header ── */}
      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border bg-muted text-lg font-semibold text-muted-foreground">
          {isLoading ? <Skeleton className="h-16 w-16 rounded-full" /> : initials}
        </div>

        <div className="flex-1">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-5 w-24" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-semibold tracking-tight">{user?.name}</h1>
                <Badge
                  variant={user?.role === "PLATFORM_ADMIN" ? "default" : "secondary"}
                  className="flex items-center gap-1"
                >
                  {user?.role === "PLATFORM_ADMIN"
                    ? <><ShieldCheck className="h-3.5 w-3.5" /> Admin da Plataforma</>
                    : <><Shield className="h-3.5 w-3.5" /> Usuário</>
                  }
                </Badge>
                {user?.emailVerified
                  ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3.5 w-3.5" /> Email verificado</span>
                  : <span className="flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="h-3.5 w-3.5" /> Email não verificado</span>
                }
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {user?.email}
              </div>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Organizações"
          value={orgsCount}
          description="Organizações vinculadas"
          icon={<Building2 className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Vínculos"
          value={user?.members.length ?? 0}
          description="Total de memberships"
          icon={<UserIcon className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Ativos"
          value={activeCount}
          description="Vínculos com acesso liberado"
          icon={<CheckCircle2 className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Membro desde"
          value={
            user
              ? new Date(user.createdAt).toLocaleDateString("pt-BR", {
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

        {/* ── Left: Memberships ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="px-5 py-4">
              <h2 className="font-semibold">Vínculos</h2>
              <p className="text-sm text-muted-foreground">
                Organizações e unidades às quais este usuário pertence
              </p>
            </div>
            <Separator />
            <div className="p-5">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !user?.members.length ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Este usuário não possui vínculos com nenhuma organização.
                </p>
              ) : (
                <DataTable columns={membershipColumns} data={user.members} />
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Info card ── */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="px-5 py-4">
              <h2 className="font-semibold">Informações</h2>
              <p className="text-sm text-muted-foreground">Dados do cadastro</p>
            </div>
            <Separator />
            <div className="divide-y">
              {[
                { label: "Nome completo", value: user?.name },
                { label: "Email", value: user?.email },
                {
                  label: "Papel na plataforma",
                  value: user?.role === "PLATFORM_ADMIN" ? "Admin da Plataforma" : "Usuário",
                },
                {
                  label: "Email verificado",
                  value: user?.emailVerified ? "Sim" : "Não",
                },
                {
                  label: "Cadastrado em",
                  value: user
                    ? new Date(user.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "—",
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5 px-5 py-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {isLoading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    <p className="text-sm font-medium break-all">{value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
