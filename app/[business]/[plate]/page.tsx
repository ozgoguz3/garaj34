import { notFound } from 'next/navigation'
import { getOrganizationBySlug, findVisitByPlate } from '@/lib/data'
import { TrackingView } from '@/components/tracking-view'

export default async function CustomerTrackingPage({
  params,
}: {
  params: { business: string; plate: string }
}) {
  const org = await getOrganizationBySlug(params.business)
  if (!org) notFound()

  const visit = await findVisitByPlate(org.id, params.plate)
  if (!visit) notFound()

  return (
    <TrackingView
      visit={visit}
      businessName={org.name}
      primaryColor={org.metadata?.primaryColor}
      logoUrl={org.logoUrl}
      googleMapsUrl={org.metadata?.googleMapsUrl}
    />
  )
}