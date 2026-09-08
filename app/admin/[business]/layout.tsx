import { getBusinessBySlug } from '@/lib/data'
import { getAuthedBusiness } from '@/lib/actions'
import { AdminLogin } from '@/components/admin/admin-login'
import { AdminShell } from '@/components/admin/admin-shell'

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ business: string }>
}

export default async function AdminLayout({ children, params }: LayoutProps) {
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

  const authState = (await getAuthedBusiness(slug)) as { business: typeof business; role: 'boss' | 'employee' } | null

  if (!authState) {
    return <AdminLogin slug={slug} businessName={business.name} />
  }

  return (
    <AdminShell business={authState.business} slug={slug} role={authState.role}>
      {children}
    </AdminShell>
  )
}