'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, LogOut, X, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LicensePlate } from '@/components/license-plate'
import { TrackingView } from '@/components/tracking-view'
import { NewJobForm } from '@/components/admin/new-job-form'
import { ActiveJobs } from '@/components/admin/active-jobs'
import { CustomerDatabase } from '@/components/admin/customer-database'
import { logoutAction } from '@/lib/actions'
import type { Job, ArchivedJob } from '@/lib/jobs-store'
import type { RetentionInsight } from '@/lib/data'

type AdminDashboardProps = {
  businessId: string
  businessSlug: string
  businessName: string
  initialJobs: Job[]
  initialArchive: ArchivedJob[]
  initialInsights: RetentionInsight[]
}

export function AdminDashboard({
  businessId,
  businessSlug,
  businessName,
  initialJobs,
  initialArchive,
  initialInsights,
}: AdminDashboardProps) {
  const router = useRouter()
  const [previewJob, setPreviewJob] = useState<Job | null>(null)

  function handleLogout() {
    logoutAction(businessSlug).then(() => router.refresh())
  }

  return (
    <div className="bg-grid min-h-dvh">
      <header className="glass sticky top-0 z-10 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="glow-neon flex size-10 shrink-0 items-center justify-center rounded-lg bg-neon text-neon-foreground">
              <Sparkles className="size-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold leading-tight tracking-tight sm:text-lg">{businessName}</h1>
              <p className="text-[10px] text-muted-foreground sm:text-xs">Yönetim Paneli</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-red-400"
          >
            <LogOut className="mr-1.5 size-4" />
            Çıkış
          </Button>
        </div>

        {/* Aktif araçları hızlıca gözden geçirmek için kaydırılabilir plaka şeridi.
            Bir plakaya dokununca o müşterinin ekranını (canlı takip görünümünü)
            admin hiçbir yere yönlendirilmeden burada önizleyebiliyor. */}
        {initialJobs.length > 0 && (
          <div className="border-t border-border/60 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Önizle:
              </span>
              {initialJobs.map((job) => (
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
        )}
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_380px] lg:py-8">
        <div className="flex flex-col gap-6">
          <NewJobForm businessId={businessId} businessSlug={businessSlug} />
          <ActiveJobs jobs={initialJobs} businessId={businessId} businessSlug={businessSlug} />
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <CustomerDatabase
            archive={initialArchive}
            insights={initialInsights}
            businessSlug={businessSlug}
          />
        </div>
      </main>

      {/* Müşteri Ekranı Önizleme Modalı */}
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
    </div>
  )
}
