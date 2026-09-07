'use client'

import { use } from 'react'
import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { TrackingView } from '@/components/tracking-view'
import { LicensePlate } from '@/components/license-plate'
import { plateToSlug, useJobs } from '@/lib/jobs-store'

export default function PlateTrackingPage({ params }: { params: Promise<{ plate: string }> }) {
  const { plate } = use(params)
  const { findByPlate, jobs } = useJobs()
  
  // URL'den gelen slug'ı plaka ile tam eşleştirmek için aratıyoruz
  const decodedSlug = decodeURIComponent(plate).replace(/\s+/g, '').toUpperCase()
  const job = jobs.find((j) => plateToSlug(j.plate) === decodedSlug)

  if (!job) {
    return (
      <main className="bg-grid flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
        <SearchX className="size-10 text-muted-foreground" />
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Bu plaka için aktif işlem bulunmuyor</h1>
          <p className="text-sm text-muted-foreground">
            Aracınızın işlemleri tamamlanmış ve teslim edilmiş olabilir.
          </p>
        </div>
        <Link href="/" className="text-neon underline underline-offset-4">
          Ana Sayfaya Dön
        </Link>
      </main>
    )
  }

  return <TrackingView job={job} />
}