"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getToken } from "@/lib/auth"
import { api, type Organization } from "@/lib/api"
import { DataTable } from "@/components/ui/data-table"
import { orgColumns } from "@/components/organizations/org-columns"
import { Button } from "@/components/ui/button"

export default function OrganizationsPage() {
  const { user, loading } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (loading || !user) return

    const token = getToken()
    if (!token) return

    api.organizations
      .list(token)
      .then(setOrganizations)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [loading, user])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organizações</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie todas as organizações da plataforma
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Nova organização
        </Button>
      </div>

      {error ? (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <DataTable
          columns={orgColumns}
          data={organizations}
          isLoading={isLoading}
          searchColumn="name"
          searchPlaceholder="Buscar por nome..."
        />
      )}
    </div>
  )
}
