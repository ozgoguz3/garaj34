// components/admin/new-job-form.tsx
'use client'
import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ExternalLink, ShieldCheck, AlertTriangle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SectionCard } from '@/components/admin/section-card'
import { buildWhatsAppLink, plateToSlug, formatPlateLive, WARRANTY_ELIGIBLE_SERVICES } from '@/lib/jobs-store'
import { SERVICE_CATALOG, TIER_LABELS, type ServiceTier } from '@/lib/catalog'
import { addVisitAction } from '@/lib/actions'
import { cn } from '@/lib/utils'

const QUICK_PICKS = ['İç + Dış Yıkama', 'Premium Yıkama', 'Motor Temizliği', 'Detaylı İç Temizlik', 'Pasta & Cila', 'Seramik Kaplama', 'Cam Filmi', 'PPF Kaplama']
const WARRANTY_PRESETS = [{ label: '12 Ay', months: 12 }, { label: '24 Ay', months: 24 }, { label: '36 Ay', months: 36 }]

export function NewJobForm({ organizationId, businessSlug }: { organizationId: string; businessSlug: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [plate, setPlate] = useState('')
  const [phone, setPhone] = useState('')
  const [services, setServices] = useState<string[]>([])
  const [showAllServices, setShowAllServices] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [carModel, setCarModel] = useState('')
  const [warrantyMonths, setWarrantyMonths] = useState<number | null>(null)
  const [damageNote, setDamageNote] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [lastLink, setLastLink] = useState<{ wa: string; track: string; plate: string } | null>(null)

  const canSubmit = plate.trim().length > 0 && services.length > 0
  const showWarranty = services.some((s) => (WARRANTY_ELIGIBLE_SERVICES as readonly string[]).includes(s))

  function toggleService(s: string) { setServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]) }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setFormError(null)
    startTransition(async () => {
      const res = await addVisitAction(businessSlug, organizationId, { customerName, plate, carModel, phone, services, warrantyMonths: showWarranty ? (warrantyMonths ?? undefined) : undefined, damageNote, internalNote })
      if (!res.ok) { setFormError(res.error); return }
      const visit = res.value
      const displayPlate = visit.plate || plate
      const waLink = buildWhatsAppLink(visit.phone, displayPlate, businessSlug, window.location.origin)
      setLastLink({ wa: waLink, track: `/${businessSlug}/${plateToSlug(displayPlate)}`, plate: displayPlate })
      if (waLink) window.open(waLink, '_blank', 'noopener,noreferrer')
      setPlate(''); setPhone(''); setServices([]); setCustomerName(''); setCarModel(''); setWarrantyMonths(null); setDamageNote(''); setInternalNote(''); setShowDetails(false)
      router.refresh()
    })
  }

  return (
    <SectionCard title="Hızlı Araç Kaydı" description="Plaka + telefon + hizmet: yeter. Gerisi isteğe bağlı.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Plaka <span className="text-neon">*</span></Label>
          <Input value={plate} onChange={(e) => setPlate(formatPlateLive(e.target.value))} placeholder="34 ABC 123" className="h-14 font-mono text-lg font-bold uppercase tracking-[0.15em]" autoComplete="off" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Telefon</Label>
          <Input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))} placeholder="05xx xxx xx xx" className="h-11 font-mono" />
        </div>
        
        <div className="flex flex-col gap-2">
          <Label>Hizmetler <span className="text-neon">*</span></Label>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
            {QUICK_PICKS.map((s) => (
              <button key={s} type="button" onClick={() => toggleService(s)} className={cn('shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-all active:scale-95', services.includes(s) ? 'border-neon bg-neon/15 text-neon' : 'border-border text-muted-foreground')}>{s}</button>
            ))}
          </div>
          <button type="button" onClick={() => setShowAllServices((v) => !v)} className="self-start text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            {showAllServices ? 'Hızlı listeye dön' : 'Tüm hizmetler (kademeli)'}
          </button>
        </div>

        <button type="button" onClick={() => setShowDetails((v) => !v)} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors">
          Detay ekle <ChevronDown className={cn('size-4 transition-transform duration-200', showDetails && 'rotate-180')} />
        </button>

        {showDetails && (
          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
            <div className="grid grid-cols-2 gap-3">
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Müşteri adı" className="h-10" />
              <Input value={carModel} onChange={(e) => setCarModel(e.target.value)} placeholder="Araç modeli" className="h-10" />
            </div>
            <Textarea value={damageNote} onChange={(e) => setDamageNote(e.target.value)} placeholder="Hasar / müşteriye görünecek not" rows={2} />
          </div>
        )}

        {formError && <p className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{formError}</p>}

        <Button type="submit" disabled={!canSubmit || isPending} className="glow-neon h-13 w-full bg-neon py-3.5 text-base font-bold text-neon-foreground hover:brightness-110">
          {isPending ? 'Kaydediliyor...' : 'Kaydet & WhatsApp Linki Gönder'}
        </Button>
      </form>
    </SectionCard>
  )
}