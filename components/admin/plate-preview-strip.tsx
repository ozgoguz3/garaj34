'use client'

import { useState } from 'react'
import { Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LicensePlate } from '@/components/license-plate'
import { TrackingView } from '@/components/tracking-view'
import type { Visit } from '@/lib/data'

type PlatePreviewStripProps = {
  visits: Visit[]
  businessName: string
}

export function PlatePreviewStrip({ visits, businessName }: PlatePreviewStripProps) {
  const [previewVisit, setPreviewVisit] = useState<Visit | null>(null)

  if (visits.length === 0) return null

  return (
    <>
      <div className="glass rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Müşteri Önizle:
          </span>
          {visits.map((visit) => (
            <button
              key={visit.id}
              onClick={() => setPreviewVisit(visit)}
              className="shrink-0 rounded-md transition-transform hover:scale-105"
              aria-label={`${visit.plate} müşteri ekranını önizle`}
            >
              <LicensePlate plate={visit.plate || ''} />
            </button>
          ))}
        </div>
      </div>

      {previewVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border">
            <div className="glass flex items-center justify-between border-x-0 border-t-0 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <Eye className="size-4 text-cyan" />
                <span className="text-muted-foreground">Müşteri şunu görüyor:</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPreviewVisit(null)} className="size-8 p-0">
                <X className="size-5" />
              </Button>
            </div>
            <div className="overflow-y-auto">
              <TrackingView visit={previewVisit} businessName={businessName} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}