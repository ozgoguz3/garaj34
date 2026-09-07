'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, Clock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LicensePlate } from '@/components/license-plate'
import { STEPS, plateToSlug, type Job, type StepIndex } from '@/lib/jobs-store'
import { setStepAction, archiveJobAction } from '@/lib/actions'
import { cn } from '@/lib/utils'

const timeFormatter = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' })

type JobCardProps = {
  job: Job
  businessId: string
  businessSlug: string
}

export function JobCard({ job, businessId, businessSlug }: JobCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isReady = job.step === 2

  function handleSetStep(step: StepIndex) {
    startTransition(async () => {
      await setStepAction(businessSlug, businessId, job.id, step)
      router.refresh()
    })
  }

  function handleArchive() {
    startTransition(async () => {
      await archiveJobAction(businessSlug, businessId, job.id)
      router.refresh()
    })
  }

  return (
    <article
      className={cn(
        'flex flex-col gap-5 rounded-xl border bg-background/40 p-5 transition-shadow',
        isReady ? 'border-neon/40 glow-neon' : 'border-border',
        isPending && 'opacity-60',
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-bold leading-tight">{job.customerName}</h3>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              <time dateTime={job.createdAt}>{timeFormatter.format(new Date(job.createdAt))}</time>
            </span>
            <span aria-hidden>·</span>
            <span>{job.phone}</span>
          </div>

          {job.services && job.services.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {job.services.map((s, i) => (
                <span
                  key={i}
                  className="rounded-md bg-secondary/60 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0">
          <LicensePlate plate={job.plate} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Durum güncelle">
        {STEPS.map((s, i) => {
          const active = i === job.step
          const done = i < job.step
          return (
            <button
              key={s.key}
              type="button"
              disabled={isPending}
              onClick={() => handleSetStep(i as StepIndex)}
              aria-pressed={active}
              className={cn(
                'flex h-10 items-center justify-center rounded-lg border text-[11px] font-bold transition-all sm:text-sm',
                active && 'glow-cyan border-cyan bg-cyan/15 text-cyan',
                done && 'border-neon/30 bg-neon/10 text-neon',
                !active && !done &&
                  'border-border bg-muted/60 text-muted-foreground hover:border-cyan/40 hover:text-foreground',
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
          disabled={isPending}
          onClick={handleArchive}
          className="h-10 flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/70"
        >
          <Archive className="mr-2 size-4" />
          Teslim Edildi / Arşive Ekle
        </Button>
        <Button
          variant="ghost"
          className="h-10 w-full text-muted-foreground sm:w-auto"
          render={<a href={`/${businessSlug}/${plateToSlug(job.plate)}`} target="_blank" rel="noopener noreferrer" />}
        >
          <ExternalLink className="mr-2 size-4" />
          Yeni Sekmede Aç
        </Button>
      </div>
    </article>
  )
}
