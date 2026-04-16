"use client"

import { useState, useCallback } from "react"
import { MapPin } from "lucide-react"

import { getToken } from "@/lib/auth"
import { api, type CreateLocationInput, ApiError } from "@/lib/api"

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

type Step = 1 | 2

interface FormState {
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
}

const EMPTY_FORM: FormState = {
  name: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  phone: "",
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

interface RegisterLocationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  onSuccess: () => void
}

export function RegisterLocationSheet({
  open,
  onOpenChange,
  orgId,
  onSuccess,
}: RegisterLocationSheetProps) {
  const [step, setStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) =>
      setForm((f) => ({ ...f, [key]: value })),
    [],
  )

  function reset() {
    setStep(1)
    setError(null)
    setForm(EMPTY_FORM)
  }

  function handleOpenChange(value: boolean) {
    if (!value) reset()
    onOpenChange(value)
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)
    try {
      const token = getToken()!
      const payload: CreateLocationInput = {
        name: form.name.trim(),
        ...(form.address.trim() && { address: form.address.trim() }),
        ...(form.city.trim() && { city: form.city.trim() }),
        ...(form.state.trim() && { state: form.state.trim() }),
        ...(form.zipCode.trim() && { zipCode: form.zipCode.trim() }),
        ...(form.phone.trim() && { phone: form.phone.trim() }),
      }
      await api.locations.create(token, orgId, payload)
      onSuccess()
      handleOpenChange(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro inesperado. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canAdvance = form.name.trim().length >= 2

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle>Cadastrar unidade</SheetTitle>
          <SheetDescription>
            Adicione um novo local vinculado a esta organização.
          </SheetDescription>
          <div className="pt-2">
            <StepIndicator current={step} total={2} />
          </div>
        </SheetHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Step 1: Nome ── */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <p className="text-sm text-muted-foreground">
                Dê um nome para a unidade. O slug de identificação será gerado automaticamente.
              </p>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="location-name">
                  Nome da unidade <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location-name"
                    placeholder="Ex: Unidade Centro"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && canAdvance && setStep(2)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
                {form.name.trim().length > 0 && form.name.trim().length < 2 && (
                  <p className="text-xs text-muted-foreground">Mínimo de 2 caracteres.</p>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          {/* ── Step 2: Endereço ── */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div className="rounded-lg border bg-muted/40 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                  Unidade
                </p>
                <p className="text-sm font-medium">{form.name}</p>
              </div>

              <p className="text-sm text-muted-foreground">
                Informe o endereço da unidade. Todos os campos são opcionais.
              </p>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="location-address">Endereço</Label>
                <Input
                  id="location-address"
                  placeholder="Rua Augusta, 100"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="location-city">Cidade</Label>
                  <Input
                    id="location-city"
                    placeholder="São Paulo"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="location-state">Estado</Label>
                  <Input
                    id="location-state"
                    placeholder="SP"
                    maxLength={2}
                    value={form.state}
                    onChange={(e) => set("state", e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="location-zip">CEP</Label>
                  <Input
                    id="location-zip"
                    placeholder="01310-100"
                    value={form.zipCode}
                    onChange={(e) => set("zipCode", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="location-phone">Telefone</Label>
                  <Input
                    id="location-phone"
                    placeholder="+55 11 9000-0000"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
        </div>

        <Separator />

        <SheetFooter className="px-6 py-4 flex-row justify-between gap-2">
          {step === 1 ? (
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setStep(1)}>
              Voltar
            </Button>
          )}

          {step === 1 ? (
            <Button onClick={() => setStep(2)} disabled={!canAdvance}>
              Próximo
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Cadastrar unidade"}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
