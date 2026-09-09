import { getOrganizationBySlug } from '@/lib/data'
import { getAuthedOrganization } from '@/lib/actions'
import { AdminLogin } from '@/components/admin/admin-login'
import { AdminShell } from '@/components/admin/admin-shell'
import { BillingGate } from '@/components/admin/billing-gate'
import { billingState } from '@/lib/billing'

type LayoutProps = { children: React.ReactNode; params: Promise<{ business: string }> }

export default async function AdminLayout({ children, params }: LayoutProps) {
  const { business: slug } = await params
  const org = await getOrganizationBySlug(slug)
  if (!org) {
    return (
      <main className="bg-grid flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-semibold">İşletme bulunamadı</h1>
        <p className="text-sm text-muted-foreground">Bu adres için kayıtlı bir işletme yok. Lütfen size verilen yönetim linkini kontrol edin.</p>
      </main>
    )
  }
  const authState = await getAuthedOrganization(slug)
  if (!authState) return <AdminLogin slug={slug} businessName={org.name} />
  const bill = billingState(authState.organization)
  if (bill.status === 'expired') return <BillingGate organization={authState.organization} bill={bill} />
  return (
    <AdminShell organization={authState.organization} slug={slug} role={authState.role}>
      {children}
    </AdminShell>
  )
}