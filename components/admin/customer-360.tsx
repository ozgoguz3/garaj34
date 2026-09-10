// components/admin/customer-360.tsx
'use client'
import { useMemo, useState } from 'react'
import { MessageCircle, Calendar, Car, ShieldCheck, Zap, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LicensePlate } from '@/components/license-plate'
import { SectionCard } from '@/components/admin/section-card'
import { buildWhatsAppLink } from '@/lib/jobs-store'
import { calculateLifecycle, STAGE_META } from '@/lib/lifecycle'
import { visitWeight } from '@/lib/catalog'
import type { Visit } from '@/lib/data'
import { cn } from '@/lib/utils'

export function Customer360({ completedVisits, businessSlug }: { completedVisits: Visit[]; businessSlug: string }) {
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'at_risk' | 'loyal' | 'opportunity'>('all')

  const customers = useMemo(() => {
    const customerMap = new Map<string, any>()
    for (const v of completedVisits) {
      const key = v.phone || v.plate || 'unknown'
      const existing = customerMap.get(key) || { plate: v.plate || '', name: v.customerName || 'İsimsiz', phone: v.phone || '', visits: [], totalWeight: 0, services: new Set<string>(), hasProtection: false, hasPaint: false, lastVisit: 0 }
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
    return Array.from(customerMap.entries()).map(([key, data]) => {
      const daysSince = Math.floor((now - data.lastVisit) / 86400000)
      const insight = calculateLifecycle(data.visits.length, data.totalWeight, daysSince, 45, [...data.services], data.hasProtection, data.hasPaint)
      return { key, plate: data.plate, name: data.name, phone: data.phone, insight, visits: data.visits }
    }).sort((a, b) => b.insight.daysOverdue - a.insight.daysOverdue)
  }, [completedVisits])

  const filtered = customers.filter(c => {
    if (filter === 'all') return true
    if (filter === 'at_risk') return c.insight.stage === 'at_risk' || c.insight.stage === 'high_risk'
    if (filter === 'loyal') return c.insight.stage === 'loyal'
    if (filter === 'opportunity') return c.insight.protectionGap
    return true
  })

  function recall(phone: string | undefined | null, plate: string | undefined) {
    if (!plate) return
    const link = buildWhatsAppLink(phone, plate, businessSlug, window.location.origin)
    if (link) window.open(link, '_blank', 'noopener,noreferrer')
  }

  return (
    <SectionCard title="Müşteri Portföyü (360°)" description="Yaşam döngüsüne göre segmentlenmiş müşteriler" action={<Badge variant="outline" className="font-mono">{customers.length} müşteri</Badge>}>
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button onClick={() => setFilter('all')} className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-colors', filter === 'all' ? 'bg-neon/15 text-neon border border-neon/30' : 'text-muted-foreground hover:bg-muted')}>Tümü</button>
        <button onClick={() => setFilter('at_risk')} className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-colors', filter === 'at_risk' ? 'bg-gold/15 text-gold border border-gold/30' : 'text-muted-foreground hover:bg-muted')}><AlertTriangle className="mr-1 inline size-3" /> Risk</button>
        <button onClick={() => setFilter('opportunity')} className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-colors', filter === 'opportunity' ? 'bg-neon/15 text-neon border border-neon/30' : 'text-muted-foreground hover:bg-muted')}><Zap className="mr-1 inline size-3" /> Fırsat</button>
      </div>

      <ul className="flex flex-col divide-y divide-border">
        {filtered.slice(0, 10).map((c) => {
          const meta = STAGE_META[c.insight.stage]
          return (
            <li key={c.key} onClick={() => setSelectedCustomer(c.key)} className="group flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between cursor-pointer rounded-lg px-2 transition-colors hover:bg-muted/40">
              <div className="flex items-start gap-4 sm:items-center">
                <LicensePlate plate={c.plate || 'BİLİNMİYOR'} />
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold">{c.name}</span>
                    <Badge variant="outline" className="text-[10px]">{meta.icon} {meta.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="size-3" /> {c.insight.daysSinceLastVisit} gün önce</span>
                    {c.insight.daysOverdue > 0 && <span className="text-gold">{c.insight.daysOverdue} gün gecikti</span>}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); recall(c.phone, c.plate) }} className="border-cyan/50 bg-transparent text-cyan hover:bg-cyan/10">
                <MessageCircle className="mr-2 size-4" /> Ulaş
              </Button>
            </li>
          )
        })}
      </ul>
    </SectionCard>
  )
}