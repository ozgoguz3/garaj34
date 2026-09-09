import { getOrganizationBySlug, listActiveVisits } from '@/lib/data'
import { NewJobForm } from '@/components/admin/new-job-form'
import { ActiveJobs } from '@/components/admin/active-jobs'
import { PlatePreviewStrip } from '@/components/admin/plate-preview-strip'

export default async function AktifIslerPage({ params }: { params: Promise<{ business: string }> }) {
  const { business: slug } = await params
  const org = await getOrganizationBySlug(slug)
  if (!org) return null

  const visits = await listActiveVisits(org.id)

  return (
    <div className="flex flex-col gap-6">
      <PlatePreviewStrip visits={visits} businessName={org.name} />
      <NewJobForm organizationId={org.id} businessSlug={slug} />
      <ActiveJobs visits={visits} organizationId={org.id} businessSlug={slug} />
    </div>
  )
}