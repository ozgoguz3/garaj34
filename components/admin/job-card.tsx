'use client'

import { Archive, Clock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LicensePlate } from '@/components/license-plate'
import { STEPS, plateToSlug, useJobs, type Job, type StepIndex } from '@/lib/jobs-store'
import { cn } from '@/lib/utils'

const timeFormatter = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' })

type JobCardProps = {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  const { setStep, archiveJob } = useJobs()
  const isReady = job.step === 3

  return (
    <article
      className={cn(
        'flex flex-col gap-5 rounded-xl border bg-background/40 p-5 transition-shadow',
        isReady ? 'border-neon/40 glow-neon' : 'border-border',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold leading-tight">{job.customerName}</h3>
          <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <Clock className="size-3" />
            <time dateTime={job.createdAt}>{timeFormatter.format(new Date(job.createdAt))}</time>
            <span aria-hidden>·</span>
            {job.phone}
          </span>
        </div>
        <LicensePlate plate={job.plate} />
      </div>

      <div className="grid grid-cols-4 gap-2" role="group" aria-label="Durum güncelle">
        {STEPS.map((s, i) => {
          const active = i === job.step
          const done = i < job.step
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setStep(job.id, i as StepIndex)}
              aria-pressed={active}
              className={cn(
                'flex h-10 items-center justify-center rounded-lg border text-xs font-semibold transition-all sm:text-sm',
                active && 'glow-cyan border-cyan bg-cyan/15 text-cyan',
                done && 'border-neon/30 bg-neon/10 text-neon',
                !active && !done && 'border-border bg-muted/60 text-muted-foreground hover:border-cyan/40 hover:text-foreground',
              )}
            >
              {s.adminLabel}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="secondary"
          onClick={() => archiveJob(job.id)}
          className="h-10 flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/70"
        >
          <Archive />
          Teslim Edildi / Arşive Ekle
        </Button>
        <Button
          variant="ghost"
          className="h-10 text-muted-foreground"
          render={<a href={`/${plateToSlug(job.plate)}`} target="_blank" rel="noopener noreferrer" />}
        >
          <ExternalLink />
          Müşteri Ekranı
        </Button>
      </div>
    </article>
  )
}
