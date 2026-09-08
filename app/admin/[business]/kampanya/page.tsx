import { getBusinessBySlug, getCampaignSegment } from '@/lib/data'
import { CampaignBuilder } from '@/components/admin/campaign-builder'
import { getAuthedBusiness } from '@/lib/actions'
import { redirect } from 'next/navigation'

export default async function KampanyaPage({ params }: { params: Promise<{ business: string }> }) {
  const { business: slug } = await params
  const business = await getBusinessBySlug(slug)
  if (!business) return null

  // Giriş kontrolü
  const isAuthed = await getAuthedBusiness(slug)
  if (!isAuthed) {
    redirect(`/admin/${slug}`)
  }

  // HIZ OPTİMİZASYONU: Veriyi sunucuda önden çekip komponente hazır veriyoruz (gecikmeyi önler)
  const initialCustomers = await getCampaignSegment(business.id, 'inactive_30')

  return (
    <CampaignBuilder 
      businessId={business.id} 
      businessSlug={slug} 
      initialData={initialCustomers} 
    />
  )
}