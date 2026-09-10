// components/admin/section-card.tsx
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SectionCardProps = { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }

export function SectionCard({ title, description, action, children, className }: SectionCardProps) {
  return (
    <section className={cn('docket flex flex-col gap-5 p-5 pl-7 sm:p-6 sm:pl-8', className)}>
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}