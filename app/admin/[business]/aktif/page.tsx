import { getBusinessBySlug, listActiveJobs } from '@/lib/data'
import { NewJobForm } from '@/components/admin/new-job-form'
import { ActiveJobs } from '@/components/admin/active-jobs'
import { PlatePreviewStrip } from '@/components/admin/plate-preview-strip'

export default async function AktifIslerPage({ params }: { params: Promise<{ business: string }> }) {
  const { business: slug } = await params
  const business = await getBusinessBySlug(slug)
  if (!business) return null

  const jobs = await listActiveJobs(business.id)

  return (
    <div className="flex flex-col gap-6">
      <PlatePreviewStrip jobs={jobs} businessName={business.name} />
      <NewJobForm businessId={business.id} businessSlug={slug} />
      <ActiveJobs jobs={jobs} businessId={business.id} businessSlug={slug} />
    </div>
  )
}
