'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Send, CheckCircle2, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SectionCard } from '@/components/admin/section-card'
import { buildWhatsAppLink, plateToSlug, WARRANTY_ELIGIBLE_SERVICES } from '@/lib/jobs-store'
import { addVisitAction } from '@/lib/actions'

const SERVICE_OPTIONS = ['İç/Dış Yıkama', 'Detaylı Temizlik', 'Pasta & Cila', 'Seramik Kaplama', 'Motor Yıkama', 'Kaput Filmi', 'Cam Filmi', 'Far Bakımı', 'Torpedo Kuaför']
const WARRANTY_PRESETS = [{ label: '12 Ay', months: 12 }, { label: '24 Ay', months: 24 }, { label: '36 Ay', months: 36 }]

export function NewJobForm({ organizationId, businessSlug }: { organizationId: string, businessSlug: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [customerName, setCustomerName] = useState('')
  const [plate, setPlate] = useState('')
  const [carModel, setCarModel] = useState('')
  const [phone, setPhone] = useState('')
  const [services, setServices] = useState<string[]>([])
  const [warrantyMonths, setWarrantyMonths] = useState<number | null>(null)
  const [damageNote, setDamageNote] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [lastLink, setLastLink] = useState<{ wa: string; track: string; plate: string } | null>(null)

  const canSubmit = plate.trim().length > 0 && services.length > 0
  const showWarranty = services.some((s) => (WARRANTY_ELIGIBLE_SERVICES as readonly string[]).includes(s))

  function toggleService(service: string) {
    setServices((prev) => prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service])
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    startTransition(async () => {
      const visit = await addVisitAction(businessSlug, organizationId, {
        customerName,
        plate,
        carModel,
        phone,
        services,
        warrantyMonths: showWarranty ? (warrantyMonths ?? undefined) : undefined,
        damageNote,
        internalNote,
      })

      const displayPlate = visit.plate || plate
      const waLink = buildWhatsAppLink(visit.phone, displayPlate, businessSlug, window.location.origin)
      
      setLastLink({ wa: waLink, track: `/${businessSlug}/${plateToSlug(displayPlate)}`, plate: displayPlate })
      if (waLink) window.open(waLink, '_blank', 'noopener,noreferrer')

      setCustomerName(''); setPlate(''); setCarModel(''); setPhone('');
      setServices([]); setWarrantyMonths(null); setDamageNote(''); setInternalNote('');
      router.refresh()
    })
  }

  return (
    <SectionCard title="Yeni İşlem Ekle" description="Plaka girin, hizmetleri seçin ve tek tıkla sisteme kaydedin.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label>Müşteri Adı <span className="text-muted-foreground text-xs">(İsteğe bağlı)</span></Label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Örn: Ahmet Yılmaz" className="h-11" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Plaka <span className="text-neon">*</span></Label>
            <Input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="34 ABC 123" className="h-11 font-mono uppercase" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Araç Modeli <span className="text-muted-foreground text-xs">(İsteğe bağlı)</span></Label>
            <Input value={carModel} onChange={(e) => setCarModel(e.target.value)} placeholder="Örn: BMW 320i" className="h-11" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Telefon <span className="text-muted-foreground text-xs">(İsteğe bağlı)</span></Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xx xxx xx xx" className="h-11 font-mono" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Label>Hizmet Tipi (En az 1 seçim yapın)</Label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_OPTIONS.map((service) => (
              <button key={service} type="button" onClick={() => toggleService(service)}
                className={`rounded-full border px-4 py-2 text-sm transition-all ${
                  services.includes(service) ? 'border-neon bg-neon/10 text-neon shadow-[0_0_10px_rgba(var(--neon-rgb),0.3)]' : 'text-muted-foreground'
                }`}
              >{service}</button>
            ))}
          </div>
        </div>

        {showWarranty && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <Label className="flex items-center gap-1.5 text-amber-400"><ShieldCheck className="size-4" /> Garanti Süresi</Label>
            <div className="flex gap-2">
              {WARRANTY_PRESETS.map((p) => (
                <button key={p.months} type="button" onClick={() => setWarrantyMonths(p.months)}
                  className={`rounded-full border px-4 py-1.5 text-xs transition-all ${warrantyMonths === p.months ? 'border-amber-400 bg-amber-500/15 text-amber-400' : 'text-muted-foreground'}`}
                >{p.label}</button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-1.5 text-amber-400"><AlertTriangle className="size-4" /> Tespit Edilen Hasar/Not (Müşteri Görecek)</Label>
            <Textarea value={damageNote} onChange={(e) => setDamageNote(e.target.value)} placeholder="Örn: Arka tampon çizik..." rows={2} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Dahili Notlar (Sadece siz göreceksiniz)</Label>
            <Textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} placeholder="Özel talepler vs..." rows={2} />
          </div>
        </div>

        <Button type="submit" disabled={!canSubmit || isPending} className="glow-neon h-14 w-full bg-neon text-neon-foreground font-bold text-base hover:brightness-110">
          {isPending ? 'Kaydediliyor...' : 'Sisteme Kaydet & WhatsApp Linki Oluştur'}
        </Button>

        {lastLink && (
           <div className="flex flex-col gap-4 rounded-xl border border-neon/30 bg-neon/10 p-4 sm:flex-row sm:justify-between items-center mt-2">
             <span className="flex items-center gap-2 text-neon font-medium"><CheckCircle2 className="size-5" /> {lastLink.plate} kaydedildi.</span>
             <div className="flex gap-2">
               {lastLink.wa && <Button variant="outline" className="border-neon/40 text-neon" render={<a href={lastLink.wa} target="_blank" rel="noopener noreferrer"/>}>WhatsApp'ta Aç</Button>}
               <Button variant="ghost" render={<a href={lastLink.track} target="_blank" rel="noopener noreferrer"/>}><ExternalLink className="mr-2 size-4" /> Takip Ekranı</Button>
             </div>
           </div>
        )}
      </form>
    </SectionCard>
  )
}