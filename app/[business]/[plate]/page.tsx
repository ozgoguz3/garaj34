import { SearchX } from 'lucide-react'
import { TrackingView } from '@/components/tracking-view'
import { getBusinessBySlug, findJobByPlate } from '@/lib/data'

type PageProps = {
  params: Promise<{ business: string; plate: string }>
}

export default async function PlateTrackingPage({ params }: PageProps) {
  const { business: businessSlug, plate } = await params
  const business = await getBusinessBySlug(businessSlug)

  // İşletme bulunamazsa (yanlış/eski link) müşteriye genel bir mesaj gösteriyoruz,
  // hangi işletmelerin var olduğunu asla ifşa etmiyoruz.
  if (!business) {
    return <NotFoundScreen />
  }

  const decodedSlug = decodeURIComponent(plate).replace(/\s+/g, '').toUpperCase()
  const job = await findJobByPlate(business.id, decodedSlug)

  if (!job) {
    return <NotFoundScreen />
  }

  return <TrackingView job={job} businessName={business.name} primaryColor={business.primaryColor} logoUrl={business.logoUrl} />
}

function NotFoundScreen() {
  return (
    <main className="bg-grid flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <SearchX className="size-10 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Bu plaka için aktif işlem bulunmuyor</h1>
        <p className="text-sm text-muted-foreground">
          Aracınızın işlemleri tamamlanmış ve teslim edilmiş olabilir.
        </p>
      </div>
    </main>
  )
}
