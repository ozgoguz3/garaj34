import { getOrganizationBySlug } from '@/lib/data'
import { BrandingForm } from '@/components/admin/branding-form'

export default async function AyarlarPage({ params }: { params: Promise<{ business: string }> }) {
  const { business: slug } = await params
  const org = await getOrganizationBySlug(slug)
  if (!org) return null

  return (
    <div className="flex flex-col gap-6">
      <BrandingForm organization={org} slug={slug} />

      <div className="glass rounded-xl p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">İşletme Bilgileri</p>
        <p className="mt-2">Panel adresi: <span className="font-mono text-foreground">/admin/{slug}</span></p>
        <p>İşletme adı: <span className="text-foreground">{org.name}</span></p>
      </div>
    </div>
  )
}