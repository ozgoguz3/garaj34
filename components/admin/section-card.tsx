import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SectionCardProps = {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({ title, description, action, children, className }: SectionCardProps) {
  return (
    <section className={cn('glass flex flex-col gap-6 rounded-2xl p-6', className)}>
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}
