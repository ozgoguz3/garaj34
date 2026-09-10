// components/admin/empty-state.tsx
import type { ElementType } from 'react'

export function EmptyState({ icon: Icon, title, description }: { icon: ElementType; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-neon/20 bg-neon/10 text-neon">
        <Icon className="size-6" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      {description && <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  )
}