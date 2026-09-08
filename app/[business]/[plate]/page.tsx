import { SearchX } from 'lucide-react'
import { TrackingView } from '@/components/tracking-view'
import { getBusinessBySlug, findJobByPlate } from '@/lib/data'

type PageProps = { params: Promise<{ business: string; plate: string }> }

export default async function PlateTrackingPage({ params }: PageProps) {
  const { business: businessSlug, plate } = await params
  const business = await getBusinessBySlug(businessSlug)

  if (!business) return <NotFoundScreen />

  const decodedSlug = decodeURIComponent(plate).replace(/\s+/g, '').toUpperCase()
  const job = await findJobByPlate(business.id, decodedSlug)

  if (!job) return <NotFoundScreen />

  return (
    <TrackingView 
      job={job} 
      businessName={business.name} 
      primaryColor={business.primaryColor} 
      logoUrl={business.logoUrl} 
      googleMapsUrl={business.googleMapsUrl} // BAK BURASI EKLENDI!
    />
  )
}

function NotFoundScreen() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <SearchX className="size-10 text-muted-foreground" />
      <h1 className="text-xl font-semibold">Aktif İşlem Bulunamadı</h1>
    </main>
  )
}