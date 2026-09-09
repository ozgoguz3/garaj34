import { redirect } from 'next/navigation'
import { getAuthedOrganization } from '@/lib/actions'
import { listActiveVisits, listCompletedVisits, getRetentionInsights } from '@/lib/data'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

export default async function AdminDashboardPage({ params }: { params: { business: string } }) {
  const auth = await getAuthedOrganization(params.business)
  if (!auth) redirect(`/admin/${params.business}`)

  const org = auth.organization
  const activeVisits = await listActiveVisits(org.id)
  const completedVisits = await listCompletedVisits(org.id)
  const insights = await getRetentionInsights(org.id)

  return (
    <AdminDashboard
      organizationId={org.id}
      businessSlug={org.slug}
      businessName={org.name}
      activeVisits={activeVisits}
      completedVisits={completedVisits}
      insights={insights}
    />
  )
}