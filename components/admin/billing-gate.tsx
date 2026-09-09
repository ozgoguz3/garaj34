import { Lock, BadgeCheck } from 'lucide-react'
import { PLANS, tl, type BillingState } from '@/lib/billing'
import type { Organization } from '@/lib/data'
import { Button } from '@/components/ui/button'

export function BillingGate({ organization, bill }: { organization: Organization; bill: BillingState }) {
  const ownerWa = process.env.NEXT_PUBLIC_OWNER_WA || ''
  const msg = encodeURIComponent(`Merhaba! ${organization.name} için Garaj34 aboneliğimi yenilemek istiyorum.`)
  return (
    <main className="bg-grid flex min-h-dvh items-center justify-center p-4">
      <div className="flex w-full max-w-3xl flex-col gap-6 rounded-2xl border border-amber-500/20 bg-background/70 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <Lock className="size-6" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400/80">{bill.plan.name} planı</p>
          <h1 className="text-xl font-bold tracking-tight">Abonelik süresi sona erdi</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Merak etmeyin: <span className="text-foreground">{organization.name}</span> verileriniz silinmedi, güvenle saklanıyor.
            Devam etmek için size uygun planı seçin; aktivasyon aynı gün yapılır.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLANS.filter((p) => p.id !== 'trial').map((p) => (
            <div key={p.id} className="glass flex flex-col gap-3 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{p.name}</span>
                {p.id === 'pro' && <BadgeCheck className="size-4 text-neon" />}
              </div>
              <span className="text-2xl font-bold">{tl(p.priceMonthly)}<span className="text-xs font-normal text-muted-foreground">/ay</span></span>
              <ul className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                {p.features.slice(0, 4).map((f) => <li key={f}>• {f}</li>)}
              </ul>
              {p.lifetime && <p className="text-[10px] text-muted-foreground/70">Tek seferlik lisans: {tl(p.lifetime)}</p>}
            </div>
          ))}
        </div>
        {ownerWa && (
          <Button
            className="glow-neon h-12 w-full bg-neon text-base font-bold text-neon-foreground hover:brightness-110"
            render={<a href={`https://wa.me/${ownerWa}?text=${msg}`} target="_blank" rel="noopener noreferrer" />}
          >
            WhatsApp&apos;tan Yenile / Yükselt
          </Button>
        )}
        <p className="text-center text-[11px] text-muted-foreground">
          Ödeme sonrası paneliniz dakikalar içinde açılır. Fatura bilgisi için bizimle iletişiminiz yeterli.
        </p>
      </div>
    </main>
  )
}