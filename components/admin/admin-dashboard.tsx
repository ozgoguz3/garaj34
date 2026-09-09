'use client'
import { NewJobForm } from '@/components/admin/new-job-form'
import { ActiveJobs } from '@/components/admin/active-jobs'
import { CustomerDatabase } from '@/components/admin/customer-database'
import type { Visit, RetentionInsight } from '@/lib/data'

type AdminDashboardProps = {
  organizationId: string
  businessSlug: string
  activeVisits: Visit[]
  completedVisits: Visit[]
  insights: RetentionInsight[]
}

export function AdminDashboard({ organizationId, businessSlug, activeVisits, completedVisits, insights }: AdminDashboardProps) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-5">
        <NewJobForm organizationId={organizationId} businessSlug={businessSlug} />
        <ActiveJobs visits={activeVisits} organizationId={organizationId} businessSlug={businessSlug} />
      </div>
      <div className="lg:sticky lg:top-32 lg:self-start">
        <CustomerDatabase completedVisits={completedVisits} insights={insights} businessSlug={businessSlug} />
      </div>
    </div>
  )
}