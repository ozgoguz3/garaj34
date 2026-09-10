// components/admin/branding-form.tsx
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

export function BrandingForm({ organization, slug }: { organization: Organization; slug: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [logoUrl, setLogoUrl] = useState(organization.logoUrl ?? '')
  const [tagline, setTagline] = useState(organization.tagline ?? '')
  const [color, setColor] = useState(organization.primaryColor ?? '#10b981')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    startTransition(async () => {
      await updateBrandingAction(slug, organization.id, { logoUrl, tagline, primaryColor: color })
      setSaved(true); router.refresh()
      setTimeout(() => setSaved(false), 2500)
    })
  }

  return (
    <SectionCard title="Marka Ayarları" description="Logo, slogan ve ana renk">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="logoUrl">Logo Adresi (URL)</Label>
          <Input id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className="h-11 bg-input/40" />
        </div>
        <Button onClick={handleSave} disabled={isPending} className="h-12 w-full text-neon-foreground" style={{ backgroundColor: color }}>
          {saved ? <><CheckCircle2 className="mr-2 size-4" /> Kaydedildi</> : isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </Button>
      </div>
    </SectionCard>
  )
}