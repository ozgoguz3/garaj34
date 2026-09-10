// components/admin/plates-rail.tsx
'use client'
import { useState } from 'react'
import { Eye, X } from 'lucide-react'
import { LicensePlate } from '@/components/license-plate'
import { TrackingView } from '@/components/tracking-view'
import { Button } from '@/components/ui/button'
import type { Visit } from '@/lib/data'
import { cn } from '@/lib/utils'

const STATUS_DOT: Record<string, string> = { queued: 'bg-muted-foreground', processing: 'bg-neon', ready: 'bg-ok' }

export function PlatesRail({ visits, businessName }: { visits: Visit[]; businessName: string }) {
  const [preview, setPreview] = useState<Visit | null>(null)
  if (visits.length === 0) return null

  return (
    <>
      <div className="border-t border-border/50 px-4 py-2">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Serviste {visits.length}</span>
          {visits.map((v) => (
            <button key={v.id} onClick={() => setPreview(v)} className="relative shrink-0 rounded-md transition-transform duration-150 hover:scale-105 active:scale-95" aria-label={`${v.plate} müşteri ekranı`}>
              <LicensePlate plate={v.plate || ''} />
              <span className={cn('absolute -right-1 -top-1 size-2.5 rounded-full ring-2 ring-background', STATUS_DOT[v.status] || 'bg-muted-foreground')} />
            </button>
          ))}
        </div>
      </div>
      {preview && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 sm:items-center sm:p-4" onClick={() => setPreview(null)}>
          <div className="relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border bg-background sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="glass-blur flex items-center justify-between border-b border-border px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-muted-foreground"><Eye className="size-4 text-cyan" /> Müşteri ne görüyor?</span>
              <Button variant="ghost" size="icon-sm" onClick={() => setPreview(null)}><X className="size-5" /></Button>
            </div>
            <div className="overflow-y-auto"><TrackingView visit={preview} businessName={businessName} /></div>
          </div>
        </div>
      )}
    </>
  )
}