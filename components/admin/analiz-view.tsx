'use client'
import { Users2, Car, TrendingUp, Gauge, Award, CalendarDays, Target, ShieldCheck } from 'lucide-react'
import { SectionCard } from '@/components/admin/section-card'
import { Badge } from '@/components/ui/badge'
import { valueTier } from '@/lib/catalog'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const monthFmt = new Intl.DateTimeFormat('tr-TR', { month: 'short', year: '2-digit' })
const TIER_TONE: Record<string, string> = {
  muted: 'border-border text-muted-foreground',
  cyan: 'border-cyan/30 text-cyan',
  neon: 'border-neon/30 text-neon',
  gold: 'border-gold/30 text-gold',
}

export function AnalizView({ data }: { data: any }) {
  const services: { service: string; count: number }[] = data.services || []
  const weekdays: { weekday: number; count: number }[] = data.weekdays || []
  const ratio = data.ratio || { total: 0, returning: 0, new: 0 }
  const trend: { month: string; visits: number }[] = data.trend || []
  const behavior = data.behavior || { monthWeight: [], top: [], tierMix: [], protectionShare: 0, avgWeight: 0, totalWeight: 0, totalVisits: 0 }
  const mw: { month: string; weight: number; visits: number }[] = behavior.monthWeight
  const top: { name: string; plate: string; visits: number; weight: number }[] = behavior.top
  const tierMix: { label: string; count: number }[] = behavior.tierMix

  const returningPct = ratio.total > 0 ? Math.round((ratio.returning / ratio.total) * 100) : 0
  const lastM = mw.length ? mw[mw.length - 1] : null
  const prevM = mw.length > 1 ? mw[mw.length - 2] : null
  const delta = lastM && prevM ? lastM.weight - prevM.weight : 0
  const maxService = Math.max(...services.map((s) => s.count), 1)
  const maxWeek = Math.max(...weekdays.map((w) => w.count), 1)
  const maxMw = Math.max(...mw.map((m) => m.weight), 1)
  const maxTier = Math.max(...tierMix.map((t) => t.count), 1)

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Gauge} label="Bu Ay İş Yükü" value={lastM ? `${lastM.weight} puan` : '—'} sub={prevM ? `${delta >= 0 ? '+' : ''}${delta} puan` : undefined} color="neon" />
        <Kpi icon={TrendingUp} label="Ort. İş Ağırlığı" value={behavior.avgWeight ? String(behavior.avgWeight) : '—'} color="cyan" />
        <Kpi icon={ShieldCheck} label="Koruma Payı" value={`%${behavior.protectionShare}`} color="neon" />
        <Kpi icon={Users2} label="Tekrar Eden" value={`%${returningPct}`} color="cyan" />
      </div>

      <SectionCard title="Aylık İş Yükü" description="Son 6 ay · hizmet ağırlığı puanı." action={lastM ? <Badge variant="outline" className="font-mono text-neon">{lastM.weight} puan</Badge> : undefined}>
        {mw.length === 0 ? <Empty /> : (
          <div className="flex h-40 items-end justify-between gap-2">
            {mw.map((m) => (
              <div key={m.month} className="group flex flex-1 flex-col items-center gap-2">
                <div className="relative w-full">
                  <div className="w-full rounded-t-lg bg-neon transition-all duration-300"
                    style={{ height: `${Math.max((m.weight / maxMw) * 100, 5)}%`, minHeight: '32px' }}
                    title={`${m.weight} puan · ${m.visits} araç`} />
                  <span className="absolute inset-x-0 -top-6 text-center text-[10px] font-semibold opacity-0 transition-opacity group-hover:opacity-100">{m.weight}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{monthFmt.format(new Date(m.month))}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Kademe Kırılımı" description="Hangi iş tipi ağırlıklı yapılıyor.">
          {tierMix.length === 0 ? <Empty /> : tierMix.map((t) => (
            <div key={t.label} className="mb-2 flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs font-medium">{t.label}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-cyan" style={{ width: `${(t.count / maxTier) * 100}%` }} />
              </div>
              <span className="w-6 text-right font-mono text-xs">{t.count}</span>
            </div>
          ))}
        </SectionCard>
        <SectionCard title="Popüler Hizmetler">
          {services.length === 0 ? <Empty /> : services.map((s, i) => (
            <div key={s.service} className="mb-2 flex items-center gap-3">
              <span className="w-28 truncate text-xs font-medium sm:w-36">{s.service}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-neon" style={{ width: `${(s.count / maxService) * 100}%` }} />
              </div>
              <span className="w-6 text-right font-mono text-xs">{s.count}</span>
              {i === 0 && <Award className="size-3.5 text-gold" />}
            </div>
          ))}
        </SectionCard>
      </div>

      <SectionCard title="En Yoğun Günler">
        {weekdays.length === 0 ? <Empty /> : weekdays.map((w) => (
          <div key={w.weekday} className="mb-2 flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs font-medium">{WEEKDAYS[w.weekday]}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-cyan" style={{ width: `${(w.count / maxWeek) * 100}%` }} />
            </div>
            <span className="w-6 text-right font-mono text-xs">{w.count}</span>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="En Değerli Müşteriler" description="Hizmet ağırlığına göre ilk 10.">
        {top.length === 0 ? <Empty /> : (
          <ul className="flex flex-col divide-y divide-border/50">
            {top.map((t, i) => {
              const tier = valueTier(t.weight)
              return (
                <li key={t.plate} className="flex items-center justify-between py-2.5">
                  <span className="flex min-w-0 items-center gap-3 text-sm">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neon/10 text-xs font-bold text-neon">{i + 1}</span>
                    <span className="truncate font-medium">{t.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{t.plate}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className={cn('rounded-full border px-2 py-0.5 text-[10px]', TIER_TONE[tier.tone])}>{tier.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">{t.weight}p</span>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Stratejik Öneriler">
        <div className="flex flex-col gap-3">
          {returningPct < 40 && ratio.total > 0 && (
            <Tip icon={Target} color="amber" title="Sadakat düşük" text={`Araçların %${100 - returningPct}'si tek seferde kalıyor. Kampanya sekmesinden 30-60 gün gelmeyenlere mesaj at.`} />
          )}
          {trend.length >= 2 && trend[trend.length - 1].visits < trend[trend.length - 2].visits && (
            <Tip icon={CalendarDays} color="cyan" title="Araç girişleri azalıyor" text="Geçen aya göre düşüş var. Garanti süresi dolanlara bakım hatırlatması tam zamanı." />
          )}
          {behavior.protectionShare < 20 && behavior.totalVisits > 5 && (
            <Tip icon={ShieldCheck} color="neon" title="Koruma payı düşük" text="İşlerin çoğu rutin yıkamada. Kampanya → 'Koruma Satılabilecekler' segmentine pasta-cila sonrası seramik teklifi gönder." />
          )}
          {behavior.avgWeight > 0 && behavior.avgWeight < 3 && (
            <Tip icon={Gauge} color="cyan" title="Sepeti büyüt" text="Ortalama iş ağırlığı düşük; yıkamaya gelenlere iç detay/ozon gibi yan paket öner." />
          )}
        </div>
      </SectionCard>
    </div>
  )
}

function Kpi({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: 'neon' | 'cyan' }) {
  const c = color === 'neon' ? 'text-neon bg-neon/10 border-neon/20' : 'text-cyan bg-cyan/10 border-cyan/20'
  return (
    <div className="glass flex flex-col gap-2 rounded-xl p-4">
      <div className={`flex size-9 items-center justify-center rounded-lg border ${c}`}><Icon className="size-4" /></div>
      <span className="text-lg font-bold leading-tight sm:text-xl">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {sub && <span className="text-[10px] text-muted-foreground/70">{sub}</span>}
    </div>
  )
}
function Tip({ icon: Icon, color, title, text }: { icon: any; color: string; title: string; text: string }) {
  const map: Record<string, string> = {
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
    cyan: 'border-cyan/20 bg-cyan/5 text-cyan',
    neon: 'border-neon/20 bg-neon/5 text-neon',
  }
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${map[color]}`}>
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div><p className="font-semibold">{title}</p><p className="text-sm text-muted-foreground">{text}</p></div>
    </div>
  )
}
function Empty() {
  return <p className="py-8 text-center text-sm text-muted-foreground">Henüz yeterli veri yok. Birkaç işlem tamamlandığında grafikler dolar.</p>
}