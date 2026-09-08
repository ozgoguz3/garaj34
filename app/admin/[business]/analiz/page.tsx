import { BarChart3, Users2, Calendar, TrendingUp } from 'lucide-react'
import {
  getBusinessBySlug,
  getServicePopularity,
  getBusiestWeekday,
  getNewVsReturningRatio,
  getMonthlyRevenueTrend,
} from '@/lib/data'
import { SectionCard } from '@/components/admin/section-card'

const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const currency = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })
const monthFormatter = new Intl.DateTimeFormat('tr-TR', { month: 'short', year: '2-digit' })

export default async function AnalizPage({ params }: { params: Promise<{ business: string }> }) {
  const { business: slug } = await params
  const business = await getBusinessBySlug(slug)
  if (!business) return null

  const [services, weekdays, ratio, trend] = await Promise.all([
    getServicePopularity(business.id),
    getBusiestWeekday(business.id),
    getNewVsReturningRatio(business.id),
    getMonthlyRevenueTrend(business.id),
  ])

  const maxServiceCount = Math.max(...services.map((s) => s.count), 1)
  const maxWeekdayCount = Math.max(...weekdays.map((w) => w.count), 1)
  const maxRevenue = Math.max(...trend.map((t) => t.revenue), 1)
  const returningPct = ratio.total > 0 ? Math.round((ratio.returning / ratio.total) * 100) : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-cyan"><Users2 className="size-4" /><span className="text-xs font-medium">Tekrar Eden Müşteri Oranı</span></div>
          <p className="mt-2 text-3xl font-bold">%{returningPct}</p>
          <p className="text-xs text-muted-foreground">{ratio.returning} tekrar eden / {ratio.total} toplam müşteri</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-neon"><TrendingUp className="size-4" /><span className="text-xs font-medium">Toplam Kayıtlı Müşteri</span></div>
          <p className="mt-2 text-3xl font-bold">{ratio.total}</p>
          <p className="text-xs text-muted-foreground">{ratio.new} yeni müşteri</p>
        </div>
      </div>

      <SectionCard title="En Çok Tercih Edilen Hizmetler" description="Arşivdeki tüm işlemlere göre.">
        {services.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Henüz yeterli veri yok.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {services.map((s) => (
              <div key={s.service} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-xs text-muted-foreground sm:w-40">{s.service}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-neon" style={{ width: `${(s.count / maxServiceCount) * 100}%` }} />
                </div>
                <span className="w-6 shrink-0 text-right font-mono text-xs">{s.count}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="En Yoğun Günler" description="Hangi gün daha çok araç kabul ediliyor.">
        {weekdays.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Henüz yeterli veri yok.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {weekdays.map((w) => (
              <div key={w.weekday} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{WEEKDAYS[w.weekday]}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-cyan" style={{ width: `${(w.count / maxWeekdayCount) * 100}%` }} />
                </div>
                <span className="w-6 shrink-0 text-right font-mono text-xs">{w.count}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Aylık Ciro Trendi" description="Son 6 ay.">
        {trend.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Henüz yeterli veri yok.</p>
        ) : (
          <div className="flex items-end gap-2 h-32">
            {trend.map((t) => (
              <div key={t.month} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-t-md bg-neon/70"
                  style={{ height: `${Math.max((t.revenue / maxRevenue) * 100, 4)}%` }}
                  title={currency.format(t.revenue)}
                />
                <span className="text-[10px] text-muted-foreground">{monthFormatter.format(new Date(t.month))}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
