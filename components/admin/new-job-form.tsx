'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Send, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionCard } from '@/components/admin/section-card'
import { buildWhatsAppLink, plateToSlug, WARRANTY_ELIGIBLE_SERVICES } from '@/lib/jobs-store'
import { addJobAction } from '@/lib/actions'

const SERVICE_OPTIONS = [
  'İç/Dış Yıkama',
  'Detaylı Temizlik',
  'Pasta & Cila',
  'Seramik Kaplama',
  'Motor Yıkama',
  'Kaput Filmi'
]

const WARRANTY_PRESETS = [
  { label: '12 Ay', months: 12 },
  { label: '24 Ay', months: 24 },
  { label: '36 Ay', months: 36 },
]

type NewJobFormProps = {
  businessId: string
  businessSlug: string
}

export function NewJobForm({ businessId, businessSlug }: NewJobFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [customerName, setCustomerName] = useState('')
  const [plate, setPlate] = useState('')
  const [phone, setPhone] = useState('')
  const [price, setPrice] = useState('')
  const [services, setServices] = useState<string[]>([])
  const [warrantyMonths, setWarrantyMonths] = useState<number | null>(null)
  const [lastLink, setLastLink] = useState<{ wa: string; track: string; plate: string } | null>(null)

  const canSubmit = plate.trim().length > 0 && services.length > 0
  const showWarranty = services.some((s) => (WARRANTY_ELIGIBLE_SERVICES as readonly string[]).includes(s))

  function toggleService(service: string) {
    setServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    const inputPlate = plate
    const inputPhone = phone
    const inputName = customerName
    const inputServices = services
    const inputPrice = Number(price) || 0
    const inputWarranty = showWarranty ? warrantyMonths ?? undefined : undefined

    startTransition(async () => {
      const job = await addJobAction(businessSlug, businessId, {
        customerName: inputName,
        plate: inputPlate,
        phone: inputPhone,
        services: inputServices,
        price: inputPrice,
        warrantyMonths: inputWarranty,
      })

      const origin = window.location.origin
      const waLink = buildWhatsAppLink(job.phone, job.plate, businessSlug, origin)

      setLastLink({
        wa: waLink,
        track: `/${businessSlug}/${plateToSlug(job.plate)}`,
        plate: job.plate,
      })

      if (waLink) {
        window.open(waLink, '_blank', 'noopener,noreferrer')
      }

      setCustomerName('')
      setPlate('')
      setPhone('')
      setPrice('')
      setServices([])
      setWarrantyMonths(null)
      router.refresh()
    })
  }

  return (
    <SectionCard
      title="Yeni İşlem Ekle"
      description="Plaka girin, hizmetleri seçin ve tek tıkla sisteme kaydedin."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="customerName">Müşteri Adı <span className="text-muted-foreground text-xs">(İsteğe bağlı)</span></Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Örn: Ahmet Yılmaz"
              autoComplete="name"
              className="h-11 bg-input/40"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="plate">Plaka <span className="text-neon">*</span></Label>
            <Input
              id="plate"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="34 ABC 123"
              autoCapitalize="characters"
              className="h-11 bg-input/40 font-mono uppercase tracking-widest"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telefon <span className="text-muted-foreground text-xs">(İsteğe bağlı)</span></Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xx xxx xx xx"
              autoComplete="tel"
              className="h-11 bg-input/40 font-mono"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="price">Tutar (₺) <span className="text-muted-foreground text-xs">(İsteğe bağlı)</span></Label>
            <Input
              id="price"
              type="number"
              inputMode="decimal"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="h-11 bg-input/40 font-mono"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Label>Hizmet Tipi (En az 1 seçim yapın)</Label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_OPTIONS.map((service) => {
              const isSelected = services.includes(service)
              return (
                <button
                  key={service}
                  type="button"
                  onClick={() => toggleService(service)}
                  className={`rounded-full border px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                    isSelected
                      ? 'border-neon bg-neon/10 text-neon'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {service}
                </button>
              )
            })}
          </div>
        </div>

        {showWarranty && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <Label className="flex items-center gap-1.5 text-amber-400">
              <ShieldCheck className="size-4" /> Garanti Süresi (kaplama hizmeti seçildi)
            </Label>
            <div className="flex flex-wrap gap-2">
              {WARRANTY_PRESETS.map((preset) => (
                <button
                  key={preset.months}
                  type="button"
                  onClick={() => setWarrantyMonths(preset.months)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                    warrantyMonths === preset.months
                      ? 'border-amber-400 bg-amber-500/15 text-amber-400'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={!canSubmit || isPending}
          className="glow-neon h-14 w-full rounded-xl bg-neon text-sm font-bold text-neon-foreground transition-all hover:bg-neon hover:brightness-110 disabled:shadow-none sm:text-base [&_svg]:size-5"
        >
          <Send className="mr-2 hidden sm:block" />
          {isPending ? 'Kaydediliyor...' : 'Sisteme Kaydet & WhatsApp Linki Gönder'}
        </Button>

        {lastLink && (
          <div
            role="status"
            className="flex flex-col gap-4 rounded-xl border border-neon/30 bg-neon/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex items-center gap-2 text-neon">
              <CheckCircle2 className="size-5 shrink-0" />
              <span>
                <span className="font-mono font-bold">{lastLink.plate}</span> başarıyla kaydedildi.
              </span>
            </span>
            <div className="flex flex-col gap-2 sm:flex-row">
              {lastLink.wa && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-neon/40 text-neon hover:bg-neon/10 hover:text-neon sm:w-auto"
                  render={<a href={lastLink.wa} target="_blank" rel="noopener noreferrer" />}
                >
                  <Send className="mr-2 size-4" /> WhatsApp'ta Aç
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto"
                render={<a href={lastLink.track} target="_blank" rel="noopener noreferrer" />}
              >
                <ExternalLink className="mr-2 size-4" /> Takip Sayfası
              </Button>
            </div>
          </div>
        )}
      </form>
    </SectionCard>
  )
}
