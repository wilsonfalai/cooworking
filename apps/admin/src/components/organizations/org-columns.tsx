"use client"

import { type ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { type Organization, type OrganizationStatus } from "@/lib/api"

const statusConfig: Record<OrganizationStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ACTIVE:    { label: "Ativo",     variant: "default" },
  TRIAL:     { label: "Trial",     variant: "secondary" },
  SUSPENDED: { label: "Suspenso",  variant: "destructive" },
}

export const orgColumns: ColumnDef<Organization>[] = [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => {
      const org = row.original
      return (
        <div className="flex items-center gap-3">
          {org.logo ? (
            <img src={org.logo} alt={org.name} className="h-8 w-8 rounded-md object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <span className="font-medium">{org.name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground">{row.original.slug}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { label, variant } = statusConfig[row.original.status]
      return <Badge variant={variant}>{label}</Badge>
    },
  },
  {
    accessorKey: "createdAt",
    header: "Criado em",
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
      <Link href={`/organizations/${row.original.id}`}>
        <Button variant="outline" size="sm">
          Ver detalhes
        </Button>
      </Link>
    ),
  },
]
