import { redirect } from 'next/navigation'
import { getAuthedOrganization } from '@/lib/actions'
import {
  listActiveVisits, listCompletedVisits, getRetentionInsights, getCampaignSegment,
  getServicePopularity, getBusiestWeekday, getNewVsReturningRatio, getMonthlyVisitTrend, getBehaviorStats,
} from '@/lib/data'
import { AdminApp } from '@/components/admin/admin-app'

export default async function AdminDashboardPage({ params }: { params: Promise<{ business: string }> }) {
  const { business } = await params
  const auth = await getAuthedOrganization(business)
  if (!auth) redirect(`/admin/${business}`)
  const org = auth.organization
  const [activeVisits, completedVisits, insights, campaignInitial, services, weekdays, ratio, trend, behavior] = await Promise.all([
    listActiveVisits(org.id),
    listCompletedVisits(org.id),
    getRetentionInsights(org.id),
    getCampaignSegment(org.id, 'inactive_30'),
    getServicePopularity(org.id),
    getBusiestWeekday(org.id),
    getNewVsReturningRatio(org.id),
    getMonthlyVisitTrend(org.id),
    getBehaviorStats(org.id),
  ])
  return (
    <AdminApp
      organization={org}
      role={auth.role}
      activeVisits={activeVisits}
      completedVisits={completedVisits}
      insights={insights}
      campaignInitial={campaignInitial}
      analiz={{ services, weekdays, ratio, trend, behavior }}
    />
  )
}