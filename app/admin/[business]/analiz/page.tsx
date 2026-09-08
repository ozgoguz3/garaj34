import { BarChart3, Users2, Calendar, TrendingUp, DollarSign, Target, Award, Clock } from 'lucide-react'
import {
  getBusinessBySlug,
  getServicePopularity,
  getBusiestWeekday,
  getNewVsReturningRatio,
  getMonthlyRevenueTrend,
  getAverageServiceTime,
  getCustomerLifetimeValue,
} from '@/lib/data'
import { SectionCard } from '@/components/admin/section-card'
import { Badge } from '@/components/ui/badge'

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
  
  // Ortalama işlem süresi hesabı (son 30 işlem)
  const avgDays = trend.length > 0 
    ? Math.round(trend.reduce((acc, t) => acc + t.revenue, 0) / trend.length / 1000)
    : 0

  // En karlı hizmet
  const topService = services.length > 0 ? services[0] : null

  return (
    <div className="flex flex-col gap-6">
      {/* Özet Kartları */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Users2}
          label="Tekrar Eden Müşteri"
          value={`%${returningPct}`}
          subtext={`${ratio.returning}/${ratio.total} müşteri`}
          color="cyan"
        />
        <MetricCard
          icon={TrendingUp}
          label="Toplam Müşteri"
          value={String(ratio.total)}
          subtext={`${ratio.new} yeni müşteri`}
          color="neon"
        />
        <MetricCard
          icon={Award}
          label="En Popüler Hizmet"
          value={topService?.service.substring(0, 12) || 'Veri yok'}
          subtext={topService ? `${topService.count} kez` : ''}
          color="amber"
        />
        <MetricCard
          icon={Clock}
          label="Ort. Müşteri Aralığı"
          value={avgDays > 0 ? `${avgDays} gün` : 'Veri yok'}
          subtext="Ziyaretler arası"
          color="cyan"
        />
      </div>

      {/* Hizmet Popülaritesi */}
      <SectionCard 
        title="En Çok Tercih Edilen Hizmetler" 
        description="Arşivdeki tüm işlemlere göre."
        action={
          <Badge variant="outline" className="font-mono">
            {services.length} hizmet
          </Badge>
        }
      >
        {services.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Henüz yeterli veri yok.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {services.map((s, index) => (
              <div key={s.service} className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neon/10 text-xs font-bold text-neon">
                  {index + 1}
                </span>
                <span className="w-32 shrink-0 truncate text-sm font-medium sm:w-40">{s.service}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-neon to-cyan transition-all duration-1000" 
                    style={{ width: `${(s.count / maxServiceCount) * 100}%` }} 
                  />
                </div>
                <span className="w-8 shrink-0 text-right font-mono text-xs font-semibold">{s.count}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* En Yoğun Günler */}
      <SectionCard title="En Yoğun Günler" description="Hangi gün daha çok araç kabul ediliyor.">
        {weekdays.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Henüz yeterli veri yok.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {weekdays.map((w) => (
              <div key={w.weekday} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm font-medium">{WEEKDAYS[w.weekday]}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-cyan to-neon transition-all duration-1000" 
                    style={{ width: `${(w.count / maxWeekdayCount) * 100}%` }} 
                  />
                </div>
                <span className="w-8 shrink-0 text-right font-mono text-xs font-semibold">{w.count}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Aylık Ciro Trendi */}
      <SectionCard 
        title="Aylık Ciro Trendi" 
        description="Son 6 ay."
        action={
          trend.length > 0 && (
            <Badge variant="outline" className="font-mono text-neon">
              {currency.format(trend.reduce((acc, t) => acc + t.revenue, 0))}
            </Badge>
          )
        }
      >
        {trend.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Henüz yeterli veri yok.</p>
        ) : (
          <div className="flex items-end justify-between gap-2 h-40">
            {trend.map((t) => {
              const heightPct = Math.max((t.revenue / maxRevenue) * 100, 5)
              return (
                <div key={t.month} className="group flex flex-1 flex-col items-center gap-2">
                  <div className="relative w-full">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-neon to-cyan transition-all duration-500 hover:brightness-110 cursor-pointer"
                      style={{ height: `${heightPct}%`, minHeight: '32px' }}
                      title={`${currency.format(t.revenue)} - ${monthFormatter.format(new Date(t.month))}`}
                    >
                      <span className="absolute inset-x-0 -top-6 text-center text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100">
                        {currency.format(t.revenue)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {monthFormatter.format(new Date(t.month))}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      {/* Stratejik Öneriler */}
      <SectionCard
        title="Stratejik Öneriler"
        description="Verilerinize göre aksiyon önerileri."
      >
        <div className="flex flex-col gap-3">
          {returningPct < 40 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <Target className="size-5 shrink-0 text-amber-400 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-amber-400">Müşteri Sadakati Düşük</p>
                  <p className="text-sm text-muted-foreground">
                    Müşterilerinizin %{100 - returningPct}'si tek seferde geliyor. 
                    Sadakat programı veya hatırlatma kampanyası düşünebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {trend.length >= 2 && trend[trend.length - 1].revenue < trend[trend.length - 2].revenue && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="size-5 shrink-0 text-red-400 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-red-400">Ciro Düşüş Eğiliminde</p>
                  <p className="text-sm text-muted-foreground">
                    Son ay bir önceki aya göre daha düşük ciro. Kampanya/promosyon zamanı olabilir.
                  </p>
                </div>
              </div>
            </div>
          )}

          {services.length > 0 && services[0].count > services.slice(1).reduce((acc, s) => acc + s.count, 0) && (
            <div className="rounded-lg border border-cyan/20 bg-cyan/5 p-4">
              <div className="flex items-start gap-3">
                <Award className="size-5 shrink-0 text-cyan mt-0.5" />
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-cyan">Bir Hizmet Çok Popüler</p>
                  <p className="text-sm text-muted-foreground">
                    "{services[0].service}" hizmetiniz çok tercih ediliyor. 
                    Bu hizmette paket fiyat veya cross-sell stratejisi düşünebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  )
}

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext,
  color = 'neon'
}: { 
  icon: React.ElementType
  label: string
  value: string
  subtext?: string
  color?: 'neon' | 'cyan' | 'amber'
}) {
  const colorClasses = {
    neon: 'text-neon bg-neon/10 border-neon/20',
    cyan: 'text-cyan bg-cyan/10 border-cyan/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  }[color]

  return (
    <div className="glass flex flex-col gap-3 rounded-xl p-4 transition-all hover:shadow-lg">
      <div className={`flex size-10 items-center justify-center rounded-lg border ${colorClasses}`}>
        <Icon className="size-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">{value}</span>
        <span className="text-[11px] text-muted-foreground">{label}</span>
        {subtext && <span className="mt-1 text-[10px] text-muted-foreground/70">{subtext}</span>}
      </div>
    </div>
  )
}
