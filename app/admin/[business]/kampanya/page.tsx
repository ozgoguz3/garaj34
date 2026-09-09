import { getOrganizationBySlug, getCampaignSegment } from '@/lib/data'
import { CampaignBuilder } from '@/components/admin/campaign-builder'
import { getAuthedOrganization } from '@/lib/actions'
import { redirect } from 'next/navigation'

export default async function KampanyaPage({ params }: { params: Promise<{ business: string }> }) {
  const { business: slug } = await params
  const org = await getOrganizationBySlug(slug)
  if (!org) return null

  const isAuthed = await getAuthedOrganization(slug)
  if (!isAuthed) {
    redirect(`/admin/${slug}`)
  }

  const initialCustomers = await getCampaignSegment(org.id, 'inactive_30')

  return (
    <CampaignBuilder 
      businessId={org.id} 
      businessSlug={slug} 
      initialData={initialCustomers} 
    />
  )
}