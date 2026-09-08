'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { Megaphone, MessageCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SectionCard } from '@/components/admin/section-card'
import { getCampaignSegmentAction } from '@/lib/actions'
import type { CampaignSegment, CampaignTarget } from '@/lib/data'
import { cn } from '@/lib/utils'

const SEGMENTS: { value: CampaignSegment; label: string; description: string }[] = [
  { value: 'inactive_30', label: '30-60 Gün Gelmeyenler', description: 'Yakında unutmaya başlayacaklar — hatırlatma için ideal.' },
  { value: 'inactive_60', label: '60+ Gün Gelmeyenler', description: 'Uzun süredir uğramayan, kaybetme riski olan müşteriler.' },
  // YENİ: Seramik ve PPF filtresi eklendi!
  { value: 'ceramic_ppf_only', label: 'Seramik & Film Yaptıranlar', description: 'Garantili işlemler — periyodik bakım veya yenileme satmak için.' },
  { value: 'high_value', label: 'En Değerli 20 Müşteri', description: 'Toplam harcamaya göre en çok kazandıran müşteriler.' },
  { value: 'all_customers', label: 'Tüm Müşteriler', description: 'Genel bir duyuru/kampanya için tüm müşteri listesi.' },
]

const DEFAULT_TEMPLATE = 'Merhaba {isim}! Havalar ısınmaya başladı ☀️ Aracınız için detaylı bakım zamanı gelmiş olabilir. Uygun bir gün için bize yazabilirsiniz.'

type CampaignBuilderProps = {
  businessId: string
  businessSlug: string
  initialData?: CampaignTarget[] // YENİ: SSR Hız optimizasyonu için veriyi önden alıyoruz
}

export function CampaignBuilder({ businessId, businessSlug, initialData = [] }: CampaignBuilderProps) {
  const [segment, setSegment] = useState<CampaignSegment>('inactive_30')
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
  const [targets, setTargets] = useState<CampaignTarget[]>(initialData)
  const [sentPlates, setSentPlates] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const isFirstRender = useRef(true)

  useEffect(() => {
    // İlk render'da zaten verimiz var, boşuna DB'ye gitme (Sıfır Gecikme / No Lag)
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    startTransition(async () => {
      const result = await getCampaignSegmentAction(businessId, segment)
      setTargets(result)
      setSentPlates(new Set())
    })
  }, [segment, businessId])

  function sendTo(target: CampaignTarget) {
    // YENİ: Zeki isim tamamlama ("İsimsiz Müşteri" hatasını önler)
    const isUnknown = !target.customerName || target.customerName.toLowerCase().includes('i̇simsiz') || target.customerName.toLowerCase().includes('isimsiz')
    const firstName = isUnknown ? '' : target.customerName.split(' ')[0]
    
    let message = template
    if (isUnknown) {
      // Eğer isim yoksa, "{isim} " kısmını tamamen sil
      message = message.replace(' {isim}', '').replace('{isim}', '')
    } else {
      // İsim varsa adını koy
      message = message.replace('{isim}', firstName)
    }

    // Telefon numarasını Türkiye standart WhatsApp formatına çevir
    const digits = target.phone.replace(/\D/g, '')
    const intl = digits.startsWith('0') ? `90${digits.slice(1)}` : (digits.startsWith('90') ? digits : `90${digits}`)
    
    window.open(`https://wa.me/${intl}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
    setSentPlates((prev) => new Set(prev).add(target.plate))
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                    'flex flex-col gap-0.5 rounded-xl border p-3 text-left transition-all',
                    segment === s.value 
                      ? 'border-neon bg-neon/10 shadow-[0_0_15px_rgba(var(--neon-rgb),0.1)]' 
                      : 'border-border hover:bg-muted/40 hover:border-neon/30',
                  )}
                >
                  <span className={cn('text-sm font-semibold flex items-center gap-1.5', segment === s.value && 'text-neon')}>
                    {segment === s.value && <Sparkles className="size-3.5" />}
                    {s.label}
                  </span>
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
              rows={4}
              className="rounded-lg border border-border bg-input/40 p-3 text-sm outline-none transition-colors focus:border-neon/50 focus:bg-background"
            />
            <p className="text-xs text-muted-foreground">
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-neon">{'{isim}'}</code> yazdığın yere müşterinin adı otomatik yerleşir. Müşteri ismi kayıtlı değilse sistem bu kelimeyi gizler.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Gönderim Kuyruğu"
        description="Her karta dokunduğunda WhatsApp yeni sekmede açılır, mesaj hazır gelir — sadece gönder'e basman yeterli."
        action={
          <span className="font-mono text-xs font-medium text-neon">
            {sentPlates.size}/{targets.length} Gönderildi
          </span>
        }
      >
        {isPending ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-neon" /> 
            <span>Müşteri listesi hazırlanıyor...</span>
          </div>
        ) : targets.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted/50 mb-2">
              <Megaphone className="size-6 text-muted-foreground/50" />
            </div>
            Bu segmentte telefon numarası kayıtlı müşteri bulunamadı.
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border/50">
            {targets.map((t) => {
              const isSent = sentPlates.has(t.plate)
              return (
                <li key={t.plate} className="flex items-center justify-between gap-3 py-3.5 first:pt-1 last:pb-1">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{t.customerName}</span>
                    <span className="font-mono text-[11.5px] text-muted-foreground flex items-center gap-1.5">
                      <span className="rounded bg-muted/50 px-1.5 py-0.5 text-foreground/70">{t.plate}</span> 
                      {t.phone}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={isSent ? 'ghost' : 'outline'}
                    onClick={() => sendTo(t)}
                    className={cn(
                      'transition-all',
                      !isSent && 'border-neon/40 text-neon hover:bg-neon/15 hover:text-neon shadow-sm',
                      isSent && 'text-muted-foreground opacity-60',
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