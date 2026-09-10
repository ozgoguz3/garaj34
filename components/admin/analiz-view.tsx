// components/admin/analiz-view.tsx
'use client'
import { Users2, Car, TrendingUp, Gauge, Award, CalendarDays, Target, ShieldCheck } from 'lucide-react'
import { SectionCard } from '@/components/admin/section-card'
import { Badge } from '@/components/ui/badge'

export function AnalizView({ data }: { data: any }) {
  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="İş Zekası" description="Hizmet ağırlığı ve müşteri davranışları">
        <p className="text-sm text-muted-foreground">Detaylı BI raporları bu alanda gösterilecek.</p>
      </SectionCard>
    </div>
  )
}