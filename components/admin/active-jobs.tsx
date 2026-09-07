'use client'

import { CarFront } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { JobCard } from '@/components/admin/job-card'
import { SectionCard } from '@/components/admin/section-card'
import { useJobs } from '@/lib/jobs-store'

export function ActiveJobs() {
  const { jobs } = useJobs()

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
          <p className="text-sm">Aktif işlem yok. Yeni bir araç ekleyin.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </SectionCard>
  )
}
