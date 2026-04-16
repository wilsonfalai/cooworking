"use client"

import { useState, useCallback } from "react"
import { RefreshCw, Shuffle } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { getToken } from "@/lib/auth"
import { api, type Location, type MemberRole, ApiError } from "@/lib/api"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3

interface FoundUser {
  id: string
  name: string
  email: string
}

interface FormState {
  email: string
  name: string
  password: string
  locationIds: string[]
  role: MemberRole
}

const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  STAFF: "Staff",
  MEMBER: "Membro / Cliente",
}

const ALL_ROLES: MemberRole[] = ["OWNER", "ADMIN", "STAFF", "MEMBER"]

// ─── Password generator ───────────────────────────────────────────────────────

function generatePassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: Step; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <div
          key={s}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            s <= current ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RegisterMemberSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  locations: Location[]
  onSuccess: () => void
}

export function RegisterMemberSheet({
  open,
  onOpenChange,
  orgId,
  locations,
  onSuccess,
}: RegisterMemberSheetProps) {
  const { user } = useAuth()

  const [step, setStep] = useState<Step>(1)
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)
  const [isLooking, setIsLooking] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<FormState>({
    email: "",
    name: "",
    password: "",
    locationIds: locations.map((l) => l.id),
    role: "MEMBER",
  })

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) =>
      setForm((f) => ({ ...f, [key]: value })),
    [],
  )

  const totalSteps = isNewUser ? 3 : 2

  // ── Reset ──

  function reset() {
    setStep(1)
    setFoundUser(null)
    setIsNewUser(false)
    setError(null)
    setForm({
      email: "",
      name: "",
      password: "",
      locationIds: locations.map((l) => l.id),
      role: "MEMBER",
    })
  }

  function handleOpenChange(value: boolean) {
    if (!value) reset()
    onOpenChange(value)
  }

  // ── Step 1: Email lookup ──

  async function handleLookup() {
    if (!form.email.trim()) return
    setIsLooking(true)
    setError(null)
    try {
      const token = getToken()!
      const found = await api.users.lookup(token, form.email.trim())
      if (found) {
        setFoundUser(found)
        setIsNewUser(false)
        set("name", found.name)
      } else {
        setFoundUser(null)
        setIsNewUser(true)
        set("name", "")
        set("password", "")
      }
    } catch {
      setError("Erro ao buscar usuário.")
    } finally {
      setIsLooking(false)
    }
  }

  function handleNext() {
    if (step === 1) {
      setStep(isNewUser ? 2 : 3)
    } else if (step === 2) {
      setStep(3)
    }
  }

  // ── Step 3: Submit ──

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)
    try {
      const token = getToken()!
      let userId: string

      if (isNewUser) {
        try {
          const created = await api.users.create(token, {
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
          })
          userId = created.id
        } catch (err) {
          // Se o user já existe (retry após falha parcial), buscar o existente
          if (err instanceof ApiError && err.status === 409) {
            const existing = await api.users.lookup(token, form.email.trim())
            if (!existing) throw err
            userId = existing.id
          } else {
            throw err
          }
        }
      } else {
        userId = foundUser!.id
      }

      await Promise.all(
        form.locationIds.map((locationId) =>
          api.members.create(token, orgId, {
            userId,
            locationId,
            role: form.role,
          }),
        ),
      )

      onSuccess()
      handleOpenChange(false)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Erro inesperado. Tente novamente.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

  const isPlatformAdmin = user?.role === "PLATFORM_ADMIN"
  const availableRoles = isPlatformAdmin
    ? ALL_ROLES
    : ALL_ROLES.filter((r) => r !== "OWNER")

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle>Adicionar membro</SheetTitle>
          <SheetDescription>
            Vincule um usuário a esta organização como colaborador ou cliente.
          </SheetDescription>
          <div className="pt-2">
            <StepIndicator current={step} total={totalSteps} />
          </div>
        </SheetHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Step 1: Email ── */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <p className="text-sm text-muted-foreground">
                Informe o e-mail do usuário. Se já estiver cadastrado, apenas criaremos o vínculo.
              </p>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lookup-email">E-mail</Label>
                <div className="flex gap-2">
                  <Input
                    id="lookup-email"
                    type="email"
                    placeholder="usuario@email.com"
                    value={form.email}
                    onChange={(e) => {
                      set("email", e.target.value)
                      setFoundUser(null)
                      setIsNewUser(false)
                      set("name", "")
                      set("password", "")
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  />
                  <Button
                    variant="outline"
                    onClick={handleLookup}
                    disabled={!form.email.trim() || isLooking}
                  >
                    {isLooking ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Buscar"}
                  </Button>
                </div>
              </div>

              {foundUser && (
                <div className="rounded-lg border bg-muted/40 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Usuário encontrado
                  </p>
                  <p className="text-sm font-medium">{foundUser.name}</p>
                  <p className="text-xs text-muted-foreground">{foundUser.email}</p>
                </div>
              )}

              {isNewUser && (
                <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Usuário não encontrado
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Nenhuma conta com este e-mail. Preencha os dados para cadastrar.
                  </p>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          {/* ── Step 2: New user data ── */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <p className="text-sm text-muted-foreground">
                Preencha os dados do novo usuário. Uma senha temporária será enviada.
              </p>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="user-name">Nome completo</Label>
                <Input
                  id="user-name"
                  placeholder="João Silva"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="user-email">E-mail</Label>
                <Input id="user-email" value={form.email} readOnly className="bg-muted/40" />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="user-password">Senha temporária</Label>
                <div className="flex gap-2">
                  <Input
                    id="user-password"
                    type="text"
                    placeholder="Senha"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => set("password", generatePassword())}
                    title="Gerar senha aleatória"
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          {/* ── Step 3: Location + Role ── */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              {(foundUser || isNewUser) && (
                <div className="rounded-lg border bg-muted/40 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Usuário
                  </p>
                  <p className="text-sm font-medium">{form.name || foundUser?.name}</p>
                  <p className="text-xs text-muted-foreground">{form.email}</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>Unidades</Label>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() =>
                      set(
                        "locationIds",
                        form.locationIds.length === locations.length
                          ? []
                          : locations.map((l) => l.id),
                      )
                    }
                  >
                    {form.locationIds.length === locations.length
                      ? "Desmarcar todas"
                      : "Marcar todas"}
                  </button>
                </div>
                <div className="rounded-md border divide-y max-h-48 overflow-y-auto">
                  {locations.map((loc) => {
                    const checked = form.locationIds.includes(loc.id)
                    return (
                      <label
                        key={loc.id}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            set(
                              "locationIds",
                              checked
                                ? form.locationIds.filter((id) => id !== loc.id)
                                : [...form.locationIds, loc.id],
                            )
                          }
                          className="h-4 w-4 rounded border-input accent-primary"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{loc.name}</p>
                          {loc.city && (
                            <p className="text-xs text-muted-foreground truncate">{loc.city}{loc.state ? `, ${loc.state}` : ""}</p>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role-select">Função</Label>
                <select
                  id="role-select"
                  value={form.role}
                  onChange={(e) => set("role", e.target.value as MemberRole)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {MEMBER_ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
        </div>

        <Separator />

        <SheetFooter className="px-6 py-4 flex-row justify-between gap-2">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={() => setStep(step === 3 && !isNewUser ? 1 : (step - 1) as Step)}
            >
              Voltar
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
          )}

          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={
                step === 1
                  ? !form.email.trim() || (!foundUser && !isNewUser)
                  : step === 2
                  ? !form.name.trim() || !form.password
                  : false
              }
            >
              Próximo
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || form.locationIds.length === 0}
            >
              {isSubmitting ? "Salvando..." : "Adicionar"}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
