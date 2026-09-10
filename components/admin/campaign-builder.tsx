// components/admin/campaign-builder.tsx
'use client'
import { useState, useTransition, useEffect, useRef } from 'react'
import { Megaphone, MessageCircle, CheckCircle2, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SectionCard } from '@/components/admin/section-card'
import { getCampaignSegmentAction } from '@/lib/actions'
import type { CampaignTarget } from '@/lib/data'
import { cn } from '@/lib/utils'

export function CampaignBuilder({ businessId, businessSlug, initialData = [] }: { businessId: string; businessSlug: string; initialData?: CampaignTarget[] }) {
  const [template, setTemplate] = useState('Merhaba! Sizi uzun süredir göremedik. Özel bir bakım teklifimiz var.')
  const [targets, setTargets] = useState<CampaignTarget[]>(initialData)
  const [isPending, startTransition] = useTransition()

  function sendTo(target: CampaignTarget) {
    const digits = target.phone.replace(/\D/g, '')
    const intl = digits.startsWith('0') ? `90${digits.slice(1)}` : (digits.startsWith('90') ? digits : `90${digits}`)
    window.open(`https://wa.me/${intl}?text=${encodeURIComponent(template)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <SectionCard title="Kampanya Gönder" description="Risk altındaki müşterilere otomatik mesaj">
      <Textarea value={template} onChange={(e) => setTemplate(e.target.value)} rows={4} className="mb-4" />
      <ul className="flex flex-col divide-y divide-border/50">
        {targets.slice(0, 5).map((t) => (
          <li key={t.plate} className="flex items-center justify-between gap-3 py-3.5 px-2">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-medium">{t.customerName}</span>
              <span className="font-mono text-[11.5px] text-muted-foreground">{t.plate} · {t.phone}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => sendTo(t)}><MessageCircle className="mr-1.5 size-4" /> Gönder</Button>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}