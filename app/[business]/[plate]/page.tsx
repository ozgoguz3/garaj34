import { notFound } from 'next/navigation'
import { getOrganizationBySlug, findVisitByPlate } from '@/lib/data'
import { TrackingView } from '@/components/tracking-view'

export default async function CustomerTrackingPage({
  params,
}: {
  params: Promise<{ business: string; plate: string }>
}) {
  const { business, plate } = await params
  const org = await getOrganizationBySlug(business)
  if (!org) notFound()
  const visit = await findVisitByPlate(org.id, plate)
  if (!visit) notFound()
  return (
    <TrackingView
      visit={visit}
      businessName={org.name}
      primaryColor={org.primaryColor}
      logoUrl={org.logoUrl}
      googleMapsUrl={org.googleMapsUrl}
    />
  )
}