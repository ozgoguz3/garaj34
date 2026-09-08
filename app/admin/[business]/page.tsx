import Link from 'next/link'
import { ArrowRight, Wallet, TrendingUp, Receipt, CarFront, ShieldAlert, ChevronRight } from 'lucide-react'
import { getBusinessBySlug, getDashboardSummary, getRecentCustomers, getExpiringWarranties } from '@/lib/data'
import { LicensePlate } from '@/components/license-plate'
import { SectionCard } from '@/components/admin/section-card'
import { Button } from '@/components/ui/button'

const currency = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })
const dateFormatter = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' })

export default async function AdminHomePage({ params }: { params: Promise<{ business: string }> }) {
  const { business: slug } = await params
  const business = await getBusinessBySlug(slug)
  if (!business) return null

  const [summary, recent, warranties] = await Promise.all([
    getDashboardSummary(business.id),
    getRecentCustomers(business.id, 5),
    getExpiringWarranties(business.id),
  ])

  return (
    <div className="flex flex-col gap-6">
      {/* Özet kartları */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard icon={TrendingUp} label="Bu Ay Ciro" value={currency.format(summary.monthRevenue)} accent="neon" />
        <SummaryCard icon={Wallet} label="Toplam Alacak" value={currency.format(summary.outstandingDebt)} accent="amber" />
        <SummaryCard icon={Receipt} label="Ortalama Fiş" value={currency.format(summary.avgTicket)} accent="cyan" />
        <SummaryCard icon={CarFront} label="Aktif Araç" value={String(summary.activeCount)} accent="cyan" />
      </div>

      {/* Garanti hatırlatmaları */}
      {warranties.length > 0 && (
        <SectionCard
          title="Garanti Süresi Yaklaşanlar"
          description="Kaplama/koruma garantisi 45 gün içinde bitecek müşteriler."
        >
          <ul className="flex flex-col gap-2">
            {warranties.slice(0, 4).map((w) => (
              <li
                key={`${w.plate}-${w.warrantyEndDate}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldAlert className="size-4 shrink-0 text-amber-400" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold">{w.customerName} · {w.service}</span>
                    <span className="text-[11px] text-muted-foreground">{w.daysLeft} gün kaldı</span>
                  </div>
                </div>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">{w.plate}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Hızlı ekle */}
      <Link href={`/admin/${slug}/aktif`}>
        <Button className="glow-neon h-14 w-full rounded-xl bg-neon text-base font-bold text-neon-foreground hover:bg-neon hover:brightness-110">
          <CarFront className="mr-2 size-5" />
          Yeni Araç Ekle
        </Button>
      </Link>

      {/* Son müşteriler */}
      <SectionCard
        title="Son Müşteriler"
        description="En son teslim edilen 5 işlem."
        action={
          <Link href={`/admin/${slug}/musteriler`} className="flex items-center gap-1 text-xs font-medium text-cyan hover:underline">
            Tümü <ChevronRight className="size-3.5" />
          </Link>
        }
      >
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Henüz tamamlanmış işlem yok.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {recent.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <LicensePlate plate={c.plate} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{c.customerName}</span>
                    <span className="text-[11px] text-muted-foreground">{dateFormatter.format(new Date(c.serviceDate))}</span>
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold text-neon">{currency.format(c.price)}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Analiz sayfasına yönlendirme */}
      <Link
        href={`/admin/${slug}/analiz`}
        className="glass flex items-center justify-between rounded-xl px-5 py-4 text-sm font-medium transition-colors hover:bg-muted/40"
      >
        <span>İşletmen hakkında daha derin analizlere bakmak ister misin?</span>
        <ArrowRight className="size-4 shrink-0" />
      </Link>
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string
  accent: 'neon' | 'amber' | 'cyan'
}) {
  const accentClasses = {
    neon: 'text-neon bg-neon/10 border-neon/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    cyan: 'text-cyan bg-cyan/10 border-cyan/20',
  }[accent]

  return (
    <div className="glass flex flex-col gap-2 rounded-xl p-4">
      <div className={`flex size-8 items-center justify-center rounded-lg border ${accentClasses}`}>
        <Icon className="size-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold leading-tight tracking-tight sm:text-xl">{value}</span>
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}
