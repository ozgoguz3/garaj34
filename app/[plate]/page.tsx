'use client'

import { use } from 'react'
import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { TrackingView } from '@/components/tracking-view'
import { LicensePlate } from '@/components/license-plate'
import { normalizePlate, useJobs } from '@/lib/jobs-store'

export default function PlateTrackingPage({ params }: { params: Promise<{ plate: string }> }) {
  const { plate } = use(params)
  const { findByPlate } = useJobs()
  const job = findByPlate(decodeURIComponent(plate))

  if (!job) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
        <SearchX className="size-10 text-muted-foreground" />
        <LicensePlate plate={normalizePlate(decodeURIComponent(plate))} size="lg" />
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Bu plaka için aktif işlem yok</h1>
          <p className="text-sm text-muted-foreground">
            Araç teslim edilmiş veya henüz sisteme eklenmemiş olabilir.
          </p>
        </div>
        <Link href="/" className="text-neon underline underline-offset-4">
          Demo takip ekranına dön
        </Link>
      </main>
    )
  }

  return <TrackingView job={job} />
}
