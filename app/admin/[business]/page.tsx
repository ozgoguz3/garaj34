import Link from 'next/link'
import { ArrowRight, Users, TrendingUp, ShieldAlert, ChevronRight, CheckSquare } from 'lucide-react'
import { getBusinessBySlug, getDashboardSummary, getExpiringWarranties } from '@/lib/data'
import { SectionCard } from '@/components/admin/section-card'
import { Button } from '@/components/ui/button'

export default async function AdminHomePage({ params }: { params: Promise<{ business: string }> }) {
  const { business: slug } = await params
  const business = await getBusinessBySlug(slug)
  if (!business) return null

  const [summary, warranties] = await Promise.all([
    getDashboardSummary(business.id),
    getExpiringWarranties(business.id),
  ])

  return (
    <div className="flex flex-col gap-6">
      {/* CRM Odaklı Özet Kartları */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard icon={TrendingUp} label="Aktif Araç" value={String(summary.activeCount)} accent="neon" />
        <SummaryCard icon={CheckSquare} label="Bu Ay Biten İş" value={String(summary.monthJobCount)} accent="cyan" />
        <SummaryCard icon={Users} label="Toplam Müşteri" value={String(summary.totalCustomers)} accent="amber" />
        <SummaryCard icon={Users} label="Sadık Müşteri" value={`%${summary.returningRate}`} accent="cyan" />
      </div>

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

      <Link href={`/admin/${slug}/aktif`}>
        <Button className="glow-neon h-14 w-full rounded-xl bg-neon text-base font-bold text-neon-foreground hover:bg-neon hover:brightness-110">
          Yeni Araç Ekle & Yönet
        </Button>
      </Link>

      <Link
        href={`/admin/${slug}/analiz`}
        className="glass flex items-center justify-between rounded-xl px-5 py-4 text-sm font-medium transition-colors hover:bg-muted/40"
      >
        <span>İşletmen hakkında derin müşteri analizlerine bak</span>
        <ArrowRight className="size-4 shrink-0" />
      </Link>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, accent }: { icon: React.ElementType, label: string, value: string, accent: 'neon' | 'amber' | 'cyan' }) {
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