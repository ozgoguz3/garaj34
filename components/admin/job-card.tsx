'use client'
import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, Clock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LicensePlate } from '@/components/license-plate'
import { STEPS, STATUS_INDEX, plateToSlug } from '@/lib/jobs-store'
import { updateVisitStatusAction } from '@/lib/actions'
import type { Visit, VisitStatus } from '@/lib/data'
import { cn } from '@/lib/utils'

const timeFormatter = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' })

export function JobCard({ visit, organizationId, businessSlug }: { visit: Visit; organizationId: string; businessSlug: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<VisitStatus>(visit.status)
  const [isPending, startTransition] = useTransition()
  const currentIndex = STATUS_INDEX[status] ?? 0
  const displayPlate = visit.plate || 'BİLİNMEYOR'

  function apply(next: VisitStatus) {
    if (next === status || isPending) return
    const prev = status
    setStatus(next)
    startTransition(async () => {
      const r = await updateVisitStatusAction(businessSlug, organizationId, visit.id, next)
      if (!r.ok) setStatus(prev)
      router.refresh()
    })
  }

  return (
    <article className={cn('flex flex-col gap-4 rounded-xl border bg-background/40 p-4 transition-all duration-200', status === 'ready' ? 'border-neon/40 glow-neon' : 'border-border', isPending && 'opacity-80')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="truncate text-base font-bold leading-tight">{visit.customerName}</h3>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="size-3" /> <time>{timeFormatter.format(new Date(visit.createdAt))}</time></span>
            {visit.phone && <span>· {visit.phone}</span>}
          </div>
          {visit.services && <div className="mt-1 flex flex-wrap gap-1">{visit.services.map((s, i) => <span key={i} className="rounded-md bg-secondary/60 px-1.5 py-0.5 text-[10px]">{s}</span>)}</div>}
        </div>
        <div className="flex shrink-0"><LicensePlate plate={displayPlate} /></div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {STEPS.map((s, i) => {
          const active = s.key === status
          const done = i < currentIndex
          return (
            <button key={s.key} disabled={isPending} onClick={() => apply(s.key)}
              className={cn('flex h-9 items-center justify-center rounded-lg border text-[11px] font-bold transition-all duration-150 active:scale-[0.97]',
                active && 'glow-cyan border-cyan bg-cyan/15 text-cyan',
                done && 'border-neon/30 bg-neon/10 text-neon',
                !active && !done && 'border-border bg-muted/60 text-muted-foreground')}>
              {s.adminLabel}
            </button>
          )
        })}
      </div>
      <div className="flex flex-col gap-1.5 sm:flex-row">
        <Button variant="secondary" disabled={isPending} onClick={() => apply('completed')} className="h-9 flex-1 text-xs">
          <Archive className="mr-1.5 size-3.5" /> Teslim Edildi
        </Button>
        <Button variant="ghost" className="h-9 text-xs text-muted-foreground" render={<a href={`/${businessSlug}/${plateToSlug(displayPlate)}`} target="_blank" rel="noopener noreferrer" />}>
          <ExternalLink className="mr-1.5 size-3.5" /> Takip
        </Button>
      </div>
    </article>
  )
}