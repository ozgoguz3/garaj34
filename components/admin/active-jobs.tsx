'use client'

import { CarFront } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { JobCard } from '@/components/admin/job-card'
import { SectionCard } from '@/components/admin/section-card'
import type { Job } from '@/lib/jobs-store'

type ActiveJobsProps = {
  jobs: Job[]
  businessId: string
  businessSlug: string
}

export function ActiveJobs({ jobs, businessId, businessSlug }: ActiveJobsProps) {
  return (
    <SectionCard
      title="Aktif İşlemler"
      description="Şu anda serviste bulunan araçlar."
      action={
        <Badge className="border-cyan/40 bg-cyan/10 font-mono text-cyan">
          {jobs.length} araç
        </Badge>
      }
    >
      {jobs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-14 text-center text-muted-foreground">
          <CarFront className="size-8" />
          <p className="text-sm">Aktif işlem yok. Yukarıdan yeni bir araç ekleyin.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} businessId={businessId} businessSlug={businessSlug} />
          ))}
        </div>
      )
    }
    </SectionCard>
  )
}
