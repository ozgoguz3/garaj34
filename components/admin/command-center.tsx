// components/admin/command-center.tsx
'use client'
import { useMemo } from 'react'
import { AlertTriangle, TrendingUp, Clock, ShieldCheck, Zap } from 'lucide-react'
import { SectionCard } from '@/components/admin/section-card'
import { Badge } from '@/components/ui/badge'
import { calculateLifecycle, STAGE_META } from '@/lib/lifecycle'
import { visitWeight } from '@/lib/catalog'
import type { Visit } from '@/lib/data'
import { cn } from '@/lib/utils'

export function CommandCenter({ activeVisits, completedVisits, businessName }: { activeVisits: Visit[]; completedVisits: Visit[]; businessName: string }) {
  const insights = useMemo(() => {
    const customerMap = new Map<string, any>()
    for (const v of completedVisits) {
      const key = v.phone || v.plate || 'unknown'
      const existing = customerMap.get(key) || { name: v.customerName || 'İsimsiz', visits: [], totalWeight: 0, services: new Set<string>(), hasProtection: false, hasPaint: false, lastVisit: 0 }
      existing.visits.push(v)
      existing.totalWeight += visitWeight(v.services || [])
      v.services?.forEach((s: string) => {
        existing.services.add(s)
        if (s.includes('Seramik') || s.includes('PPF') || s.includes('Film')) existing.hasProtection = true
        if (s.includes('Pasta') || s.includes('Boya')) existing.hasPaint = true
      })
      existing.lastVisit = Math.max(existing.lastVisit, new Date(v.createdAt).getTime())
      customerMap.set(key, existing)
    }
    
    const now = Date.now()
    return Array.from(customerMap.values()).map(data => {
      const daysSince = Math.floor((now - data.lastVisit) / 86400000)
      return calculateLifecycle(data.visits.length, data.totalWeight, daysSince, 45, [...data.services], data.hasProtection, data.hasPaint)
    })
  }, [completedVisits])

  const urgentActions = insights.filter(i => i.stage === 'high_risk' || (i.stage === 'at_risk' && i.daysOverdue > 15))
  const crossSellOpportunities = insights.filter(i => i.protectionGap)

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="Bugün" description={`${businessName} — ${new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}`}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard icon={Clock} label="Aktif Araç" value={String(activeVisits.length)} color="cyan" />
          <MetricCard icon={TrendingUp} label="Fırsat" value={String(crossSellOpportunities.length)} color="neon" />
          <MetricCard icon={AlertTriangle} label="Acil Aksiyon" value={String(urgentActions.length)} color={urgentActions.length > 0 ? 'gold' : 'muted'} />
          <MetricCard icon={ShieldCheck} label="Tamamlanan" value={String(completedVisits.length)} color="ok" />
        </div>
      </SectionCard>

      {urgentActions.length > 0 && (
        <SectionCard title="🚨 Acil Dikkat" description="Bu müşteriler kaybedilme riski taşıyor" action={<Badge variant="outline" className="border-destructive/40 text-destructive">{urgentActions.length} müşteri</Badge>}>
          <ul className="flex flex-col gap-3">
            {urgentActions.slice(0, 3).map((insight, i) => (
              <li key={i} className="flex items-center justify-between gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="font-semibold">{insight.favoriteServices[0] || 'Müşteri'}</span>
                  <span className="text-xs text-muted-foreground">{insight.daysOverdue} gün gecikti</span>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: 'neon' | 'cyan' | 'gold' | 'ok' | 'muted' }) {
  const colorMap = { neon: 'text-neon bg-neon/10 border-neon/20', cyan: 'text-cyan bg-cyan/10 border-cyan/20', gold: 'text-gold bg-gold/10 border-gold/20', ok: 'text-ok bg-ok/10 border-ok/20', muted: 'text-muted-foreground bg-muted/50 border-border' }
  return (
    <div className="glass flex flex-col gap-2 rounded-xl p-4">
      <div className={cn('flex size-10 items-center justify-center rounded-lg border', colorMap[color])}><Icon className="size-5" /></div>
      <span className="text-2xl font-bold leading-tight">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}