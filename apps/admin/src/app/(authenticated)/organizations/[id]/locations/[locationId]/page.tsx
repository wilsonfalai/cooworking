"use client"

import { useEffect, useState, useMemo } from "react"
import { use } from "react"
import Link from "next/link"
import {
  MapPin,
  Users,
  Clock,
  Pencil,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Phone,
  Globe,
  Home,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react"
import { type ColumnDef } from "@tanstack/react-table"

import { useAuth } from "@/contexts/auth-context"
import { getToken } from "@/lib/auth"
import {
  api,
  type Organization,
  type Location,
  type Member,
  type MemberRole,
  type MemberStatus,
} from "@/lib/api"

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

// ─── Config ───────────────────────────────────────────────────────────────────

const locationStatusConfig = {
  ACTIVE:   { label: "Ativo",   variant: "default" as const,      icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  INACTIVE: { label: "Inativo", variant: "secondary" as const,    icon: <XCircle className="h-3.5 w-3.5" /> },
}

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

const memberStatusConfig: Record<MemberStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ACTIVE:    { label: "Ativo",     variant: "default" },
  INACTIVE:  { label: "Inativo",   variant: "secondary" },
  SUSPENDED: { label: "Suspenso",  variant: "destructive" },
  PENDING:   { label: "Pendente",  variant: "outline" },
}

// ─── Member columns ───────────────────────────────────────────────────────────

const memberColumns: ColumnDef<Member>[] = [
  {
    id: "user",
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
    header: "Membro desde",
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
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
  isLoading,
  emptyMessage,
}: {
  title: string
  description: string
  data: Member[]
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
          <DataTable columns={memberColumns} data={data} searchColumn="user" searchPlaceholder="Buscar por nome..." />
        )}
      </div>
    </div>
  )
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value, icon }: { label: string; value: string | null | undefined; icon?: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5 px-5 py-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string; locationId: string }>
}) {
  const { id: orgId, locationId } = use(params)
  const { user, loading: authLoading } = useAuth()

  const [org, setOrg] = useState<Organization | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (authLoading || !user) return
    const token = getToken()
    if (!token) return

    Promise.all([
      api.organizations.get(token, orgId),
      api.locations.get(token, orgId, locationId),
      api.members.list(token, orgId, locationId),
    ])
      .then(([orgData, locationData, membersData]) => {
        setOrg(orgData)
        setLocation(locationData)
        setMembers(membersData)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [authLoading, user, orgId, locationId])

  // ── Split members by tier ──
  const { collaborators, clients } = useMemo(() => {
    const collaboratorRoles: MemberRole[] = ["OWNER", "ADMIN", "STAFF"]
    return {
      collaborators: members.filter((m) => collaboratorRoles.includes(m.role)),
      clients: members.filter((m) => m.role === "MEMBER"),
    }
  }, [members])

  const activeMembers = members.filter((m) => m.status === "ACTIVE").length

  const addressLine = [
    location?.address,
    location?.city,
    location?.state,
    location?.country,
  ]
    .filter(Boolean)
    .join(", ")

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
        <Link href="/organizations" className="hover:text-foreground transition-colors">
          Organizações
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/organizations/${orgId}`} className="hover:text-foreground transition-colors">
          {isLoading ? <Skeleton className="inline-block h-4 w-24" /> : org?.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        {isLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <span className="text-foreground font-medium">{location?.name}</span>
        )}
      </nav>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border bg-muted">
            <MapPin className="h-7 w-7 text-muted-foreground" />
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
                  <h1 className="text-2xl font-semibold tracking-tight">{location?.name}</h1>
                  {location && (
                    <Badge
                      variant={locationStatusConfig[location.status].variant}
                      className="flex items-center gap-1"
                    >
                      {locationStatusConfig[location.status].icon}
                      {locationStatusConfig[location.status].label}
                    </Badge>
                  )}
                </div>
                {addressLine && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{addressLine}</p>
                )}
              </>
            )}
          </div>
        </div>

        <Button variant="outline" size="sm" disabled={isLoading}>
          <Link href={`/organizations/${orgId}/locations/${locationId}/edit`} className="flex items-center gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Link>
        </Button>
      </div>

      <Separator />

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Colaboradores"
          value={collaborators.length}
          description="Funcionários vinculados"
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
          title="Ativos"
          value={activeMembers}
          description="Membros com acesso liberado"
          icon={<CheckCircle2 className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Criado em"
          value={
            location
              ? new Date(location.createdAt).toLocaleDateString("pt-BR", {
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

        {/* ── Left: Members ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <MemberSection
            title="Colaboradores"
            description="Proprietários, administradores e staff desta unidade"
            data={collaborators}
            isLoading={isLoading}
            emptyMessage="Nenhum colaborador vinculado a esta unidade."
          />
          <MemberSection
            title="Clientes"
            description="Membros com acesso a esta unidade"
            data={clients}
            isLoading={isLoading}
            emptyMessage="Nenhum cliente vinculado a esta unidade."
          />
        </div>

        {/* ── Right: Info card ── */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="px-5 py-4">
              <h2 className="font-semibold">Informações</h2>
              <p className="text-sm text-muted-foreground">Dados da unidade</p>
            </div>
            <Separator />
            <div className="divide-y">
              {isLoading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <InfoRow
                    label="Slug"
                    value={location?.slug ? `/${location.slug}` : undefined}
                    icon={<Globe className="h-3 w-3" />}
                  />
                  <InfoRow
                    label="Endereço"
                    value={location?.address}
                    icon={<Home className="h-3 w-3" />}
                  />
                  <InfoRow
                    label="Cidade"
                    value={
                      [location?.city, location?.state].filter(Boolean).join(", ") || undefined
                    }
                    icon={<MapPin className="h-3 w-3" />}
                  />
                  <InfoRow
                    label="CEP"
                    value={location?.zipCode}
                    icon={<MapPin className="h-3 w-3" />}
                  />
                  <InfoRow
                    label="Telefone"
                    value={location?.phone}
                    icon={<Phone className="h-3 w-3" />}
                  />
                  <InfoRow
                    label="Fuso horário"
                    value={location?.timezone}
                    icon={<Clock className="h-3 w-3" />}
                  />
                  {!location?.address && !location?.city && !location?.phone && !location?.zipCode && (
                    <div className="p-5">
                      <div className="rounded-lg border border-dashed bg-muted/40 p-4">
                        <p className="text-sm text-muted-foreground text-center">
                          Nenhuma informação de endereço cadastrada.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
