import { getBusinessBySlug, listActiveJobs, listArchive, getRetentionInsights } from '@/lib/data'
import { getAuthedBusiness } from '@/lib/actions'
import { AdminLogin } from '@/components/admin/admin-login'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

type PageProps = {
  params: Promise<{ business: string }>
}

export default async function AdminPage({ params }: PageProps) {
  const { business: slug } = await params
  const business = await getBusinessBySlug(slug)

  if (!business) {
    return (
      <main className="bg-grid flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-semibold">İşletme bulunamadı</h1>
        <p className="text-sm text-muted-foreground">
          Bu adres için kayıtlı bir işletme yok. Lütfen size verilen yönetim linkini kontrol edin.
        </p>
      </main>
    )
  }

  const authed = await getAuthedBusiness(slug)

  if (!authed) {
    return <AdminLogin slug={slug} businessName={business.name} />
  }

  const [jobs, archive, insights] = await Promise.all([
    listActiveJobs(business.id),
    listArchive(business.id),
    getRetentionInsights(business.id),
  ])

  return (
    <AdminDashboard
      businessId={business.id}
      businessSlug={slug}
      businessName={business.name}
      initialJobs={jobs}
      initialArchive={archive}
      initialInsights={insights}
    />
  )
}
