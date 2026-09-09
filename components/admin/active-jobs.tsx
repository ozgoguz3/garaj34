'use client'

import { CarFront } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { JobCard } from '@/components/admin/job-card'
import { SectionCard } from '@/components/admin/section-card'
import type { Visit } from '@/lib/data'

type ActiveJobsProps = {
  visits: Visit[]
  organizationId: string
  businessSlug: string
}

export function ActiveJobs({ visits, organizationId, businessSlug }: ActiveJobsProps) {
  return (
    <SectionCard
      title="Aktif İşlemler"
      description="Şu anda serviste bulunan araçlar."
      action={
        <Badge className="border-cyan/40 bg-cyan/10 font-mono text-cyan">
          {visits.length} araç
        </Badge>
      }
    >
      {visits.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-14 text-center text-muted-foreground">
          <CarFront className="size-8" />
          <p className="text-sm">Aktif işlem yok. Yukarıdan yeni bir araç ekleyin.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {visits.map((visit) => (
            <JobCard key={visit.id} visit={visit} organizationId={organizationId} businessSlug={businessSlug} />
          ))}
        </div>
      )}
    </SectionCard>
  )
}