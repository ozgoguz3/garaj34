'use client'

import { useState } from 'react'
import { Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LicensePlate } from '@/components/license-plate'
import { TrackingView } from '@/components/tracking-view'
import type { Job } from '@/lib/jobs-store'

type PlatePreviewStripProps = {
  jobs: Job[]
  businessName: string
}

// Admin, aktif araçların plakalarını kaydırarak görebiliyor ve birine
// dokununca müşterinin o an ne gördüğünü hiçbir yere yönlendirilmeden
// (modal içinde) önizleyebiliyor.
export function PlatePreviewStrip({ jobs, businessName }: PlatePreviewStripProps) {
  const [previewJob, setPreviewJob] = useState<Job | null>(null)

  if (jobs.length === 0) return null

  return (
    <>
      <div className="glass rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Müşteri Önizle:
          </span>
          {jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => setPreviewJob(job)}
              className="shrink-0 rounded-md transition-transform hover:scale-105"
              aria-label={`${job.plate} müşteri ekranını önizle`}
            >
              <LicensePlate plate={job.plate} />
            </button>
          ))}
        </div>
      </div>

      {previewJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border">
            <div className="glass flex items-center justify-between border-x-0 border-t-0 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <Eye className="size-4 text-cyan" />
                <span className="text-muted-foreground">Müşteri şunu görüyor:</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPreviewJob(null)} className="size-8 p-0">
                <X className="size-5" />
              </Button>
            </div>
            <div className="overflow-y-auto">
              <TrackingView job={previewJob} businessName={businessName} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
