import { getOrganizationBySlug, listCompletedVisits, getRetentionInsights } from '@/lib/data'
import { CustomerDatabase } from '@/components/admin/customer-database'

export default async function MusterilerPage({ params }: { params: Promise<{ business: string }> }) {
  const { business: slug } = await params
  const org = await getOrganizationBySlug(slug)
  if (!org) return null

  const [completedVisits, insights] = await Promise.all([
    listCompletedVisits(org.id),
    getRetentionInsights(org.id),
  ])

  return <CustomerDatabase completedVisits={completedVisits} insights={insights} businessSlug={slug} />
}