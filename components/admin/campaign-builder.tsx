'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { Megaphone, MessageCircle, CheckCircle2, Loader2, Sparkles, Download, Copy, TrendingUp, Clock, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SectionCard } from '@/components/admin/section-card'
import { getCampaignSegmentAction } from '@/lib/actions'
import type { CampaignTarget } from '@/lib/data'
import { cn } from '@/lib/utils'

const SEGMENTS = [
  { value: 'inactive_30', label: '30-60 Gün Gelmeyenler', description: 'Yakında unutmaya başlayacaklar – hatırlatma için ideal.', icon: Clock },
  { value: 'inactive_60', label: '60+ Gün Gelmeyenler', description: 'Uzun süredir uğramayan, kaybetme riski olan müşteriler.', icon: TrendingUp },
  { value: 'ceramic_ppf_only', label: 'Seramik & Film Yaptıranlar', description: 'Garantili işlemler – periyodik bakım veya yenileme satmak için.', icon: Sparkles },
  { value: 'high_value', label: 'En Değerli 20 Müşteri', description: 'Toplam harcamaya göre en çok kazandıran müşteriler.', icon: Zap },
  { value: 'all_customers', label: 'Tüm Müşteriler', description: 'Genel bir duyuru/kampanya için tüm müşteri listesi.', icon: Users },
]

const MESSAGE_TEMPLATES = [
  { name: 'Bahar Kampanyası', text: 'Merhaba {isim}! 🌸 Bahar geldi, aracınız için detaylı bakım zamanı! %20 indirim fırsatını kaçırmayın. Randevu için bize yazın.' },
  { name: 'Yaz Hazırlığı', text: 'Sayın {isim}, yaz gelmeden seramik kaplama ile aracınızı güneşten koruyun! ☀️ Sınırlı sayıda slot kaldı.' },
  { name: 'Garanti Hatırlatma', text: 'Merhaba {isim}! Seramik kaplama garantiniz yakında sona eriyor. Ücretsiz kontrol için hemen randevu alın!' },
  { name: 'Sadakat Tebrik', text: 'Sayın {isim}, bizi tercih ettiğiniz için teşekkürler! 💙 Sadık müşterilerimize özel %15 indirim sizin için hazır.' },
]

type CampaignBuilderProps = {
  businessId: string
  businessSlug: string
  initialData?: CampaignTarget[]
}

export function CampaignBuilder({ businessId, businessSlug, initialData = [] }: CampaignBuilderProps) {
  const [segment, setSegment] = useState<string>('inactive_30')
  const [template, setTemplate] = useState(MESSAGE_TEMPLATES[0].text)
  const [targets, setTargets] = useState<CampaignTarget[]>(initialData)
  const [sentPlates, setSentPlates] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const isFirstRender = useRef(true)
  const [copiedTemplate, setCopiedTemplate] = useState(false)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    startTransition(async () => {
      const r = await getCampaignSegmentAction(businessSlug, businessId, segment)
      setTargets(r.ok ? r.value : [])
      setSentPlates(new Set())
    })
  }, [segment, businessId, businessSlug])

  function sendTo(target: CampaignTarget) {
    const isUnknown = !target.customerName || target.customerName.toLowerCase().includes('isimsiz')
    const firstName = isUnknown ? '' : target.customerName.split(' ')[0]
    let message = template
    if (isUnknown) {
      message = message.replace(' {isim}', '').replace('{isim}', '')
    } else {
      message = message.replace('{isim}', firstName)
    }
    const digits = target.phone.replace(/\D/g, '')
    const intl = digits.startsWith('0') ? `90${digits.slice(1)}` : (digits.startsWith('90') ? digits : `90${digits}`)
    window.open(`https://wa.me/${intl}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
    setSentPlates((prev) => new Set(prev).add(target.plate))
  }

  function sendToAll() {
    targets.forEach((target, index) => {
      setTimeout(() => sendTo(target), index * 1000)
    })
  }

  function exportToCSV() {
    const lines = [
      ['Plaka', 'Müşteri Adı', 'Telefon', 'Son Ziyaret'],
      ...targets.map((t) => [t.plate, t.customerName, t.phone, new Date(t.lastVisit).toLocaleDateString('tr-TR')]),
    ]
    const csv = lines.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `kampanya_${segment}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  function copyTemplate() {
    navigator.clipboard.writeText(template)
    setCopiedTemplate(true)
    setTimeout(() => setCopiedTemplate(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <SectionCard title="Kampanya Oluştur" description="Bir müşteri grubu seç, mesajını yaz – sıradaki listeyi tek tek WhatsApp'tan gönder.">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label>Kime gönderilecek?</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {SEGMENTS.map((s) => {
                const Icon = s.icon
                return (
                  <button key={s.value} onClick={() => setSegment(s.value)} className={cn('flex flex-col gap-1.5 rounded-xl border p-4 text-left transition-all', segment === s.value ? 'border-neon bg-neon/10 shadow-[0_0_15px_rgba(var(--neon-rgb),0.2)] scale-[1.02]' : 'border-border hover:bg-muted/40 hover:border-neon/30 hover:scale-[1.01]')}>
                    <div className="flex items-center gap-2">
                      <Icon className={cn('size-4', segment === s.value && 'text-neon')} />
                      <span className={cn('text-sm font-semibold', segment === s.value && 'text-neon')}>{s.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{s.description}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="template">Mesaj Şablonu</Label>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="xs" onClick={copyTemplate} className={cn(copiedTemplate && 'text-neon')}>
                  {copiedTemplate ? <CheckCircle2 className="mr-1 size-3" /> : <Copy className="mr-1 size-3" />}
                  {copiedTemplate ? 'Kopyalandı' : 'Kopyala'}
                </Button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {MESSAGE_TEMPLATES.map((t) => (
                <button key={t.name} type="button" onClick={() => setTemplate(t.text)} className="rounded-lg border border-border bg-muted/30 p-3 text-left text-xs hover:bg-muted/60 transition-colors">
                  <span className="font-semibold text-foreground">{t.name}</span>
                  <p className="mt-1 text-muted-foreground line-clamp-2">{t.text.substring(0, 60)}...</p>
                </button>
              ))}
            </div>
            <Textarea id="template" value={template} onChange={(e) => setTemplate(e.target.value)} rows={4} className="rounded-lg border border-border bg-input/40 p-3 text-sm outline-none transition-colors focus:border-neon/50 focus:bg-background" />
          </div>
        </div>
      </SectionCard>
      <SectionCard title="Gönderim Kuyruğu" description="Her karta dokunduğunda WhatsApp yeni sekmede açılır." action={<div className="flex items-center gap-3"><span className="font-mono text-xs font-medium text-neon">{sentPlates.size}/{targets.length} Gönderildi</span>{targets.length > 0 && <><Button variant="outline" size="xs" onClick={exportToCSV} className="border-cyan/40 text-cyan hover:bg-cyan/10"><Download className="mr-1 size-3" /> CSV İndir</Button><Button variant="outline" size="xs" onClick={sendToAll} disabled={isPending} className="border-neon/40 text-neon hover:bg-neon/10"><Megaphone className="mr-1 size-3" /> Tümüne Gönder</Button></>}</div>}>
        {isPending ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-muted-foreground"><Loader2 className="size-6 animate-spin text-neon" /> <span>Liste hazırlanıyor...</span></div>
        ) : targets.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground"><div className="flex size-12 items-center justify-center rounded-full bg-muted/50 mb-2"><Megaphone className="size-6 text-muted-foreground/50" /></div>Bulunamadı.</div>
        ) : (
          <ul className="flex flex-col divide-y divide-border/50">
            {targets.map((t) => {
              const isSent = sentPlates.has(t.plate)
              const daysSince = Math.floor((Date.now() - new Date(t.lastVisit).getTime()) / (1000 * 60 * 60 * 24))
              return (
                <li key={t.plate} className="flex items-center justify-between gap-3 py-3.5 px-2 hover:bg-muted/20 rounded-lg">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium">{t.customerName}</span>
                    <span className="font-mono text-[11.5px] text-muted-foreground"><span className="rounded bg-muted/50 px-1.5 py-0.5">{t.plate}</span> {t.phone} <span className="text-amber-400">• {daysSince} gün önce</span></span>
                  </div>
                  <Button size="sm" variant={isSent ? 'ghost' : 'outline'} onClick={() => sendTo(t)} className={cn('shrink-0', !isSent && 'border-neon/40 text-neon hover:bg-neon/15 hover:text-neon shadow-sm', isSent && 'text-muted-foreground opacity-60')}>
                    {isSent ? <><CheckCircle2 className="mr-1.5 size-4" /> Gönderildi</> : <><MessageCircle className="mr-1.5 size-4" /> Gönder</>}
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