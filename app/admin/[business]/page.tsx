import { redirect } from 'next/navigation'
import { getAuthedOrganization } from '@/lib/actions'
import { listActiveVisits, listCompletedVisits, getRetentionInsights } from '@/lib/data'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

export default async function AdminDashboardPage({ params }: { params: Promise<{ business: string }> }) {
  const { business } = await params
  const auth = await getAuthedOrganization(business)
  if (!auth) redirect(`/admin/${business}`)
  const org = auth.organization
  const [activeVisits, completedVisits, insights] = await Promise.all([
    listActiveVisits(org.id),
    listCompletedVisits(org.id),
    getRetentionInsights(org.id),
  ])
  return (
    <AdminDashboard
      organizationId={org.id}
      businessSlug={org.slug}
      activeVisits={activeVisits}
      completedVisits={completedVisits}
      insights={insights}
    />
  )
}