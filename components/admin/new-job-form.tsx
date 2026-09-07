'use client'

import { useState, type FormEvent } from 'react'
import { Send, CheckCircle2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionCard } from '@/components/admin/section-card'
import { buildWhatsAppLink, plateToSlug, useJobs } from '@/lib/jobs-store'

export function NewJobForm() {
  const { addJob } = useJobs()
  const [customerName, setCustomerName] = useState('')
  const [plate, setPlate] = useState('')
  const [phone, setPhone] = useState('')
  const [lastLink, setLastLink] = useState<{ wa: string; track: string; plate: string } | null>(null)

  const canSubmit = customerName.trim() && plate.trim() && phone.trim()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    const job = addJob({ customerName, plate, phone })
    const origin = window.location.origin
    setLastLink({
      wa: buildWhatsAppLink(job.phone, job.plate, origin),
      track: `/${plateToSlug(job.plate)}`,
      plate: job.plate,
    })
    setCustomerName('')
    setPlate('')
    setPhone('')
  }

  return (
    <SectionCard
      title="Yeni İşlem Ekle"
      description="Aracı sisteme kaydedin ve müşteriye takip linkini gönderin."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="customerName">Müşteri Adı</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ahmet Yılmaz"
              autoComplete="name"
              className="h-11 bg-input/40"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="plate">PLAKA</Label>
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

        <Button
          type="submit"
          disabled={!canSubmit}
          className="glow-neon h-14 w-full rounded-xl bg-neon text-base font-bold text-neon-foreground transition-all hover:bg-neon hover:brightness-110 disabled:shadow-none [&_svg]:size-5"
        >
          <Send />
          Sisteme Kaydet &amp; WhatsApp Linki Gönder
        </Button>

        {lastLink && (
          <div
            role="status"
            className="flex flex-col gap-3 rounded-xl border border-neon/30 bg-neon/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex items-center gap-2 text-neon">
              <CheckCircle2 className="size-4" />
              <span className="font-mono font-semibold">{lastLink.plate}</span> kaydedildi.
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-neon/40 text-neon hover:bg-neon/10 hover:text-neon"
                render={<a href={lastLink.wa} target="_blank" rel="noopener noreferrer" />}
              >
                <Send /> WhatsApp&apos;ta Aç
              </Button>
              <Button
                variant="ghost"
                size="sm"
                render={<a href={lastLink.track} target="_blank" rel="noopener noreferrer" />}
              >
                <ExternalLink /> Takip Sayfası
              </Button>
            </div>
          </div>
        )}
      </form>
    </SectionCard>
  )
}
