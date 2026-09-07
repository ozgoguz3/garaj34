import { Check, Clock, Droplets, KeyRound, Wind } from 'lucide-react'
import { STEPS, type StepIndex } from '@/lib/jobs-store'
import { cn } from '@/lib/utils'

const ICONS = [Clock, Droplets, Wind, KeyRound] as const

type StatusTrackerProps = {
  step: StepIndex
}

export function StatusTracker({ step }: StatusTrackerProps) {
  return (
    <ol className="relative flex flex-col" aria-label="İşlem durumu">
      {STEPS.map((s, i) => {
        const Icon = ICONS[i]
        const isDone = i < step
        const isActive = i === step
        const isLast = i === STEPS.length - 1

        return (
          <li key={s.key} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 rounded-full transition-colors duration-500',
                  isDone ? 'bg-neon' : 'bg-border',
                )}
              />
            )}

            <div className="relative shrink-0">
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-full border transition-all duration-500',
                  isDone && 'border-neon bg-neon text-neon-foreground',
                  isActive && 'glow-neon border-neon bg-neon/15 text-neon',
                  !isDone && !isActive && 'border-border bg-muted text-muted-foreground',
                )}
              >
                {isDone ? <Check className="size-5" strokeWidth={3} /> : <Icon className="size-5" />}
              </div>
              {isActive && (
                <span className="absolute -right-0.5 -top-0.5 flex size-3.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-neon opacity-75" />
                  <span className="relative inline-flex size-3.5 rounded-full bg-neon" />
                </span>
              )}
            </div>

            <div className={cn('flex flex-col gap-1 pt-1.5', !isDone && !isActive && 'opacity-50')}>
              <p
                className={cn(
                  'font-semibold leading-tight',
                  isActive ? 'text-glow-neon text-lg text-neon' : 'text-foreground',
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {s.title}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
