import { getBusinessBySlug, listArchive, getRetentionInsights } from '@/lib/data'
import { CustomerDatabase } from '@/components/admin/customer-database'

export default async function MusterilerPage({ params }: { params: Promise<{ business: string }> }) {
  const { business: slug } = await params
  const business = await getBusinessBySlug(slug)
  if (!business) return null

  const [archive, insights] = await Promise.all([
    listArchive(business.id),
    getRetentionInsights(business.id),
  ])

  return <CustomerDatabase archive={archive} insights={insights} businessSlug={slug} />
}
