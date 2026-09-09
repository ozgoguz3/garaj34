import { Check, Clock, Droplets, KeyRound, Wind } from 'lucide-react'
import { STEPS, STATUS_INDEX } from '@/lib/jobs-store'
import type { VisitStatus } from '@/lib/data'
import { cn } from '@/lib/utils'

const ICONS = [Clock, Droplets, Wind, KeyRound] as const

export function StatusTracker({ status }: { status: VisitStatus }) {
  const currentStep = STATUS_INDEX[status] ?? 0

  return (
    <ol className="relative flex flex-col" aria-label="İşlem durumu">
      {STEPS.map((s, i) => {
        const Icon = ICONS[i] || Clock
        const isDone = i < currentStep
        const isActive = i === currentStep
        const isLast = i === STEPS.length - 1

        return (
          <li key={s.key} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && <span aria-hidden className={cn('absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 rounded-full', isDone ? 'bg-neon' : 'bg-border')} />}
            <div className="relative shrink-0">
              <div className={cn('flex size-10 items-center justify-center rounded-full border transition-all duration-500', isDone && 'border-neon bg-neon text-neon-foreground', isActive && 'glow-neon border-neon bg-neon/15 text-neon', !isDone && !isActive && 'border-border bg-muted text-muted-foreground')}>
                {isDone ? <Check className="size-5" strokeWidth={3} /> : <Icon className="size-5" />}
              </div>
            </div>
            <div className={cn('flex flex-col gap-1 pt-1.5', !isDone && !isActive && 'opacity-50')}>
              <p className={cn('font-semibold leading-tight', isActive ? 'text-glow-neon text-lg text-neon' : 'text-foreground')}>{s.title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}