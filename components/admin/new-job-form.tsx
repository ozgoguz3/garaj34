'use client'

import { useState, type FormEvent } from 'react'
import { Send, CheckCircle2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionCard } from '@/components/admin/section-card'
import { buildWhatsAppLink, plateToSlug, useJobs } from '@/lib/jobs-store'

const SERVICE_OPTIONS = [
  'İç/Dış Yıkama',
  'Detaylı Temizlik',
  'Pasta & Cila',
  'Seramik Kaplama',
  'Motor Yıkama',
  'Kaput Filmi'
]

export function NewJobForm() {
  const { addJob } = useJobs()
  const [customerName, setCustomerName] = useState('')
  const [plate, setPlate] = useState('')
  const [phone, setPhone] = useState('')
  const [services, setServices] = useState<string[]>([])
  const [lastLink, setLastLink] = useState<{ wa: string; track: string; plate: string } | null>(null)

  const canSubmit = customerName.trim() && plate.trim() && phone.trim() && services.length > 0

  function toggleService(service: string) {
    setServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    const job = addJob({ customerName, plate, phone, services })
    const origin = window.location.origin
    setLastLink({
      wa: buildWhatsAppLink(job.phone, job.plate, origin),
      track: `/${plateToSlug(job.plate)}`,
      plate: job.plate,
    })
    setCustomerName('')
    setPlate('')
    setPhone('')
    setServices([])
  }

  return (
    <SectionCard
      title="Yeni İşlem Ekle"
      description="Aracı kaydedin, hizmetleri seçin ve müşteriye linki gönderin."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="customerName">Müşteri Adı</Label>
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
            <Label htmlFor="plate">Plaka</Label>
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
            <Label htmlFor="phone">Telefon</Label>
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
        </div>

        {/* Hizmet Seçimi - Yeni Eklendi */}
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

        <Button
          type="submit"
          disabled={!canSubmit}
          className="glow-neon h-14 w-full rounded-xl bg-neon text-sm font-bold text-neon-foreground transition-all hover:bg-neon hover:brightness-110 disabled:shadow-none sm:text-base [&_svg]:size-5"
        >
          <Send className="mr-2 hidden sm:block" />
          Sisteme Kaydet & WhatsApp Linki Gönder
        </Button>

        {lastLink && (
          <div
            role="status"
            className="flex flex-col gap-4 rounded-xl border border-neon/30 bg-neon/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex items-center gap-2 text-neon">
              <CheckCircle2 className="size-5 shrink-0" />
              <span>
                <span className="font-mono font-bold">{lastLink.plate}</span> kaydedildi.
              </span>
            </span>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-neon/40 text-neon hover:bg-neon/10 hover:text-neon sm:w-auto"
                render={<a href={lastLink.wa} target="_blank" rel="noopener noreferrer" />}
              >
                <Send className="mr-2 size-4" /> WhatsApp'ta Aç
              </Button>
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