import { Users2, TrendingUp, Target, Award, Car, CalendarDays } from 'lucide-react'
import {
  getOrganizationBySlug,
  getServicePopularity,
  getBusiestWeekday,
  getNewVsReturningRatio,
  getMonthlyVisitTrend,
} from '@/lib/data'
import { SectionCard } from '@/components/admin/section-card'
import { Badge } from '@/components/ui/badge'
import { redirect } from 'next/navigation'
import { getAuthedOrganization } from '@/lib/actions'

const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

// TypeScript tiplerini zorlamak için
type ServicePop = { service: string; count: number }
type WeekdayPop = { weekday: number; count: number }
type TrendPop = { month: string; visits: number }

export default async function AnalizPage({ params }: { params: Promise<{ business: string }> }) {
  const { business: slug } = await params
  const org = await getOrganizationBySlug(slug)
  if (!org) return null

  // Güvenlik: Tenant izolasyonu
  const isAuthed = await getAuthedOrganization(slug)
  if (!isAuthed || isAuthed.organization.id !== org.id) {
    redirect(`/admin/${slug}`)
  }

  const [services, weekdays, ratio, trend] = await Promise.all([
    getServicePopularity(org.id) as Promise<ServicePop[]>,
    getBusiestWeekday(org.id) as Promise<WeekdayPop[]>,
    getNewVsReturningRatio(org.id),
    getMonthlyVisitTrend(org.id) as Promise<TrendPop[]>,
  ])

  const maxServiceCount = Math.max(...services.map((s) => s.count), 1)
  const maxWeekdayCount = Math.max(...weekdays.map((w) => w.count), 1)
  const maxVisits = Math.max(...trend.map((t) => t.visits), 1)
  const returningPct = ratio.total > 0 ? Math.round((ratio.returning / ratio.total) * 100) : 0
  
  const topService = services.length > 0 ? services[0] : null
  const monthFormatter = new Intl.DateTimeFormat('tr-TR', { month: 'short', year: '2-digit' })

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Users2}
          label="Tekrar Eden Müşteri"
          value={`%${returningPct}`}
          subtext={`${ratio.returning}/${ratio.total} araç`}
          color="cyan"
        />
        <MetricCard
          icon={Car}
          label="Toplam Araç"
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
          icon={TrendingUp}
          label="Aylık Ziyaret"
          value={trend.length > 0 ? String(trend[trend.length - 1]?.visits || 0) : '0'}
          subtext="Bu ayki araç sayısı"
          color="cyan"
        />
      </div>

      <SectionCard 
        title="En Çok Tercih Edilen Hizmetler" 
        description="Tamamlanmış tüm işlemlere göre."
        action={<Badge variant="outline" className="font-mono">{services.length} hizmet</Badge>}
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
                    className="h-full rounded-full bg-gradient-to-r from-neon to-cyan transition-all duration-300" 
                    style={{ width: `${(s.count / maxServiceCount) * 100}%` }} 
                  />
                </div>
                <span className="w-8 shrink-0 text-right font-mono text-xs font-semibold">{s.count}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

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
                    className="h-full rounded-full bg-gradient-to-r from-cyan to-neon transition-all duration-300" 
                    style={{ width: `${(w.count / maxWeekdayCount) * 100}%` }} 
                  />
                </div>
                <span className="w-8 shrink-0 text-right font-mono text-xs font-semibold">{w.count}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard 
        title="Aylık Ziyaret Trendi" 
        description="Son 6 ayda tamamlanan araç sayısı."
        action={
          trend.length > 0 && (
            <Badge variant="outline" className="font-mono text-neon">
              {trend.reduce((acc, t) => acc + t.visits, 0)} Toplam Araç
            </Badge>
          )
        }
      >
        {trend.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Henüz yeterli veri yok.</p>
        ) : (
          <div className="flex items-end justify-between gap-2 h-40">
            {trend.map((t) => {
              const heightPct = Math.max((t.visits / maxVisits) * 100, 5)
              return (
                <div key={t.month} className="group flex flex-1 flex-col items-center gap-2">
                  <div className="relative w-full">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-neon to-cyan transition-all duration-300 hover:brightness-110 cursor-pointer"
                      style={{ height: `${heightPct}%`, minHeight: '32px' }}
                      title={`${t.visits} Araç - ${monthFormatter.format(new Date(t.month))}`}
                    >
                      <span className="absolute inset-x-0 -top-6 text-center text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100">
                        {t.visits}
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

      <SectionCard title="Stratejik Öneriler" description="Verilerinize göre CRM aksiyon önerileri.">
        <div className="flex flex-col gap-3">
          {returningPct < 40 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <Target className="size-5 shrink-0 text-amber-400 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-amber-400">Müşteri Sadakati Geliştirilebilir</p>
                  <p className="text-sm text-muted-foreground">
                    Araçların %{100 - returningPct}'si tek seferde kalıyor. 
                    "Kampanya" menüsünden 60+ gün gelmeyenlere bir hatırlatma mesajı atabilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {trend.length >= 2 && trend[trend.length - 1].visits < trend[trend.length - 2].visits && (
            <div className="rounded-lg border border-cyan/20 bg-cyan/5 p-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="size-5 shrink-0 text-cyan mt-0.5" />
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-cyan">Araç Girişleri Azalıyor</p>
                  <p className="text-sm text-muted-foreground">
                    Bu ay bir önceki aya göre daha az araç tamamlanmış. Eski müşterilerinize bakım hatırlatması yapmak için tam zamanı.
                  </p>
                </div>
              </div>
            </div>
          )}

          {services.length > 0 && services[0].count > services.slice(1).reduce((acc, s) => acc + s.count, 0) && (
            <div className="rounded-lg border border-neon/20 bg-neon/5 p-4">
              <div className="flex items-start gap-3">
                <Award className="size-5 shrink-0 text-neon mt-0.5" />
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-neon">Bir Hizmet Çok Popüler</p>
                  <p className="text-sm text-muted-foreground">
                    "{services[0].service}" hizmetiniz çok tercih ediliyor. 
                    Müşteriler bu hizmete geldiklerinde yanına ufak bir yan paket eklemeyi önerebilirsiniz (Çapraz satış).
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

function MetricCard({ icon: Icon, label, value, subtext, color = 'neon' }: { icon: React.ElementType, label: string, value: string, subtext?: string, color?: 'neon' | 'cyan' | 'amber' }) {
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