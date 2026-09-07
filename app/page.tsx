'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrackingView } from '@/components/tracking-view'
import { LicensePlate } from '@/components/license-plate'
import { useJobs } from '@/lib/jobs-store'
import { cn } from '@/lib/utils'

export default function DemoTrackingPage() {
  const { jobs } = useJobs()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const job = jobs.find((j) => j.id === selectedId) ?? jobs[0]

  if (!job) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold">Aktif araç bulunamadı</h1>
        <p className="text-sm text-muted-foreground">
          Demo için önce yönetim panelinden bir araç ekleyin.
        </p>
        <Link href="/admin" className="text-neon underline underline-offset-4">
          Yönetim paneline git
        </Link>
      </main>
    )
  }

  return (
    <>
      {jobs.length > 1 && (
        <nav
          aria-label="Demo araç seçimi"
          className="glass sticky top-0 z-10 flex items-center gap-2 overflow-x-auto border-x-0 border-t-0 px-4 py-2"
        >
          <span className="shrink-0 text-xs uppercase tracking-widest text-muted-foreground">Demo</span>
          {jobs.map((j) => (
            <button
              key={j.id}
              type="button"
              onClick={() => setSelectedId(j.id)}
              aria-pressed={j.id === job.id}
              className={cn(
                'shrink-0 rounded-md transition-all',
                j.id === job.id ? 'glow-cyan ring-2 ring-cyan' : 'opacity-60 hover:opacity-100',
              )}
            >
              <LicensePlate plate={j.plate} />
            </button>
          ))}
        </nav>
      )}
      <TrackingView job={job} />
    </>
  )
}
