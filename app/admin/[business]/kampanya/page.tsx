import { getBusinessBySlug } from '@/lib/data'
import { CampaignBuilder } from '@/components/admin/campaign-builder'

export default async function KampanyaPage({ params }: { params: Promise<{ business: string }> }) {
  const { business: slug } = await params
  const business = await getBusinessBySlug(slug)
  if (!business) return null

  return <CampaignBuilder businessId={business.id} businessSlug={slug} />
}
