'use client'
import { Users2, Car, TrendingUp, Wallet, Award, CalendarDays, Target } from 'lucide-react'
import { SectionCard } from '@/components/admin/section-card'
import { Badge } from '@/components/ui/badge'
import { tl } from '@/lib/billing'

const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const monthFmt = new Intl.DateTimeFormat('tr-TR', { month: 'short', year: '2-digit' })

export function AnalizView({ data }: { data: any }) {
  const services: { service: string; count: number }[] = data.services || []
  const weekdays: { weekday: number; count: number }[] = data.weekdays || []
  const ratio = data.ratio || { total: 0, returning: 0, new: 0 }
  const trend: { month: string; visits: number }[] = data.trend || []
  const revenue: { month: string; visits: number; revenue: number }[] = data.revenue || []
  const top: { name: string; plate: string; visits: number; spend: number }[] = data.topCustomers || []

  const returningPct = ratio.total > 0 ? Math.round((ratio.returning / ratio.total) * 100) : 0
  const lastRev = revenue.length ? revenue[revenue.length - 1] : null
  const avgTicket = lastRev && lastRev.visits > 0 ? lastRev.revenue / lastRev.visits : 0
  const maxService = Math.max(...services.map((s) => s.count), 1)
  const maxWeek = Math.max(...weekdays.map((w) => w.count), 1)
  const maxTrend = Math.max(...trend.map((t) => t.visits), 1)

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Wallet} label="Bu Ay Ciro" value={lastRev ? tl(lastRev.revenue) : '—'} color="neon" />
        <Kpi icon={TrendingUp} label="Ortalama Sepet" value={avgTicket ? tl(avgTicket) : '—'} color="cyan" />
        <Kpi icon={Users2} label="Tekrar Eden" value={`%${returningPct}`} color="cyan" />
        <Kpi icon={Car} label="Toplam Araç" value={String(ratio.total)} color="neon" />
      </div>

      <SectionCard title="Aylık Ciro & Araç" description="Son 6 ay." action={lastRev ? <Badge variant="outline" className="font-mono text-neon">{tl(lastRev.revenue)}</Badge> : undefined}>
        {revenue.length === 0 ? <Empty /> : (
          <div className="flex h-40 items-end justify-between gap-2">
            {revenue.map((r) => (
              <div key={r.month} className="group flex flex-1 flex-col items-center gap-2">
                <div className="relative w-full">
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-neon to-cyan transition-all duration-300"
                    style={{ height: `${Math.max((r.visits / maxTrend) * 100, 5)}%`, minHeight: '32px' }}
                    title={`${tl(r.revenue)} · ${r.visits} araç`} />
                  <span className="absolute inset-x-0 -top-6 text-center text-[10px] font-semibold opacity-0 transition-opacity group-hover:opacity-100">{tl(r.revenue)}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{monthFmt.format(new Date(r.month))}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Popüler Hizmetler">
          {services.length === 0 ? <Empty /> : services.map((s, i) => (
            <div key={s.service} className="mb-2 flex items-center gap-3">
              <span className="w-28 truncate text-xs font-medium sm:w-36">{s.service}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-neon to-cyan" style={{ width: `${(s.count / maxService) * 100}%` }} />
              </div>
              <span className="w-6 text-right font-mono text-xs">{s.count}</span>
              {i === 0 && <Award className="size-3.5 text-gold" />}
            </div>
          ))}
        </SectionCard>
        <SectionCard title="En Yoğun Günler">
          {weekdays.length === 0 ? <Empty /> : weekdays.map((w) => (
            <div key={w.weekday} className="mb-2 flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs font-medium">{WEEKDAYS[w.weekday]}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan to-neon" style={{ width: `${(w.count / maxWeek) * 100}%` }} />
              </div>
              <span className="w-6 text-right font-mono text-xs">{w.count}</span>
            </div>
          ))}
        </SectionCard>
      </div>

      <SectionCard title="En Değerli Müşteriler" description="Ciro katkısına göre ilk 10.">
        {top.length === 0 ? <Empty /> : (
          <ul className="flex flex-col divide-y divide-border/50">
            {top.map((t, i) => (
              <li key={t.plate} className="flex items-center justify-between py-2.5">
                <span className="flex items-center gap-3 text-sm">
                  <span className="flex size-6 items-center justify-center rounded-full bg-neon/10 text-xs font-bold text-neon">{i + 1}</span>
                  <span className="font-medium">{t.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{t.plate}</span>
                </span>
                <span className="font-mono text-sm font-semibold text-neon">{tl(t.spend)}</span>
              </li>
            ))}
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
          {avgTicket > 0 && avgTicket < 500 && (
            <Tip icon={Wallet} color="neon" title="Sepeti büyüt" text="Ortalama sepet düşük; yıkamaya gelenlere iç detay/ozon gibi yan paket öner." />
          )}
        </div>
      </SectionCard>
    </div>
  )
}

function Kpi({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: 'neon' | 'cyan' }) {
  const c = color === 'neon' ? 'text-neon bg-neon/10 border-neon/20' : 'text-cyan bg-cyan/10 border-cyan/20'
  return (
    <div className="glass flex flex-col gap-2 rounded-xl p-4">
      <div className={`flex size-9 items-center justify-center rounded-lg border ${c}`}><Icon className="size-4" /></div>
      <span className="text-lg font-bold leading-tight sm:text-xl">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
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