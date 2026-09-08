'use client'

import { useState, useTransition, useEffect } from 'react'
import { Megaphone, MessageCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SectionCard } from '@/components/admin/section-card'
import { getCampaignSegmentAction } from '@/lib/actions'
import type { CampaignSegment, CampaignTarget } from '@/lib/data'
import { cn } from '@/lib/utils'

const SEGMENTS: { value: CampaignSegment; label: string; description: string }[] = [
  { value: 'inactive_30', label: '30-60 Gün Gelmeyenler', description: 'Yakında unutmaya başlayacaklar — hatırlatma için ideal.' },
  { value: 'inactive_60', label: '60+ Gün Gelmeyenler', description: 'Uzun süredir uğramayan, kaybetme riski olan müşteriler.' },
  { value: 'high_value', label: 'En Değerli 20 Müşteri', description: 'Toplam harcamaya göre en çok kazandıran müşteriler.' },
  { value: 'all_customers', label: 'Tüm Müşteriler', description: 'Genel bir duyuru/kampanya için tüm müşteri listesi.' },
]

const DEFAULT_TEMPLATE = 'Merhaba {isim}! Havalar ısınmaya başladı ☀️ Aracınız için detaylı bakım zamanı gelmiş olabilir. Uygun bir gün için bize yazabilirsiniz.'

type CampaignBuilderProps = {
  businessId: string
  businessSlug: string
}

export function CampaignBuilder({ businessId, businessSlug }: CampaignBuilderProps) {
  const [segment, setSegment] = useState<CampaignSegment>('inactive_30')
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
  const [targets, setTargets] = useState<CampaignTarget[]>([])
  const [sentPlates, setSentPlates] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const result = await getCampaignSegmentAction(businessId, segment)
      setTargets(result)
      setSentPlates(new Set())
    })
  }, [segment, businessId])

  function sendTo(target: CampaignTarget) {
    const firstName = target.customerName.split(' ')[0]
    const message = template.replace('{isim}', firstName)
    const digits = target.phone.replace(/\D/g, '')
    const intl = digits.startsWith('0') ? `90${digits.slice(1)}` : digits
    window.open(`https://wa.me/${intl}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
    setSentPlates((prev) => new Set(prev).add(target.plate))
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Kampanya Oluştur"
        description="Bir müşteri grubu seç, mesajını yaz — sıradaki listeyi tek tek WhatsApp'tan gönder."
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label>Kime gönderilecek?</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {SEGMENTS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSegment(s.value)}
                  className={cn(
                    'flex flex-col gap-0.5 rounded-xl border p-3 text-left transition-colors',
                    segment === s.value ? 'border-neon bg-neon/10' : 'border-border hover:bg-muted/40',
                  )}
                >
                  <span className={cn('text-sm font-semibold', segment === s.value && 'text-neon')}>{s.label}</span>
                  <span className="text-xs text-muted-foreground">{s.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="template">Mesaj Şablonu</Label>
            <textarea
              id="template"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={3}
              className="rounded-lg border border-border bg-input/40 p-3 text-sm outline-none focus:border-neon/50"
            />
            <p className="text-xs text-muted-foreground">
              <code className="rounded bg-muted px-1 py-0.5">{'{isim}'}</code> yazdığın yere müşterinin adı otomatik yerleşir.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Gönderim Kuyruğu"
        description="Her karta dokunduğunda WhatsApp yeni sekmede açılır, mesaj hazır gelir — sadece gönder'e basman yeterli."
        action={
          <span className="font-mono text-xs text-muted-foreground">
            {sentPlates.size}/{targets.length} gönderildi
          </span>
        }
      >
        {isPending ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Yükleniyor...
          </div>
        ) : targets.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <Megaphone className="size-6" />
            Bu segmentte telefon numarası kayıtlı müşteri bulunamadı.
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {targets.map((t) => {
              const isSent = sentPlates.has(t.plate)
              return (
                <li key={t.plate} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{t.customerName}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{t.plate} · {t.phone}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={isSent ? 'ghost' : 'outline'}
                    onClick={() => sendTo(t)}
                    className={cn(
                      !isSent && 'border-neon/40 text-neon hover:bg-neon/10 hover:text-neon',
                      isSent && 'text-muted-foreground',
                    )}
                  >
                    {isSent ? (
                      <><CheckCircle2 className="mr-1.5 size-4" /> Gönderildi</>
                    ) : (
                      <><MessageCircle className="mr-1.5 size-4" /> Gönder</>
                    )}
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  )
}
