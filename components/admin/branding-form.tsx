'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionCard } from '@/components/admin/section-card'
import { updateBrandingAction } from '@/lib/actions'
import type { Organization } from '@/lib/data'

const COLOR_PRESETS = [
  { label: 'Neon Yeşil', value: '#10b981' },
  { label: 'Elektrik Mavi', value: '#3b82f6' },
  { label: 'Turuncu', value: '#f97316' },
  { label: 'Mor', value: '#a855f7' },
  { label: 'Kırmızı', value: '#ef4444' },
  { label: 'Altın', value: '#eab308' },
]

type BrandingFormProps = {
  organization: Organization
  slug: string
}

export function BrandingForm({ organization, slug }: BrandingFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [logoUrl, setLogoUrl] = useState(organization.logoUrl ?? '')
  const [tagline, setTagline] = useState(organization.tagline ?? '')
  const [color, setColor] = useState(organization.primaryColor ?? '#10b981')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    startTransition(async () => {
      await updateBrandingAction(slug, organization.id, { logoUrl, tagline, primaryColor: color })
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2500)
    })
  }

  return (
    <SectionCard title="Marka Ayarları" description="Logo, slogan ve ana renk — hem admin panelinde hem müşteri ekranında kullanılır.">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="logoUrl">Logo Adresi (URL)</Label>
          <Input id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className="h-11 bg-input/40" />
          <p className="text-xs text-muted-foreground">Logo dosyanı bir görsel barındırma sitesine (örn. imgur.com) yükleyip linkini buraya yapıştırabilirsin.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tagline">Slogan</Label>
          <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Premium Oto Detaylama" className="h-11 bg-input/40" />
        </div>
        <div className="flex flex-col gap-3">
          <Label className="flex items-center gap-1.5"><Palette className="size-4" /> Ana Renk</Label>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button key={preset.value} type="button" onClick={() => setColor(preset.value)} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${color === preset.value ? 'border-foreground/60 ring-2 ring-foreground/20' : 'border-border'}`}>
                <span className="size-3.5 rounded-full" style={{ backgroundColor: preset.value }} />
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={handleSave} disabled={isPending} className="h-12 w-full text-neon-foreground" style={{ backgroundColor: color }}>
          {saved ? <><CheckCircle2 className="mr-2 size-4" /> Kaydedildi</> : isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </Button>
      </div>
    </SectionCard>
  )
}