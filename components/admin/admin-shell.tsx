'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, CarFront, Users, Megaphone, Settings, LogOut, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlatesRail } from '@/components/admin/plates-rail'
import { logoutAction } from '@/lib/actions'
import type { Organization, Visit } from '@/lib/data'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '', label: 'Panel', icon: LayoutDashboard, roles: ['boss', 'employee'] },
  { href: '/aktif', label: 'Aktif', icon: CarFront, roles: ['boss', 'employee'] },
  { href: '/musteriler', label: 'Müşteriler', icon: Users, roles: ['boss', 'employee'] },
  { href: '/kampanya', label: 'Kampanya', icon: Megaphone, roles: ['boss'] },
  { href: '/ayarlar', label: 'Ayarlar', icon: Settings, roles: ['boss'] },
]

type AdminShellProps = {
  organization: Organization
  slug: string
  role?: 'boss' | 'employee'
  activeVisits?: Visit[]
  children: React.ReactNode
}

export function AdminShell({ organization, slug, role = 'boss', activeVisits = [], children }: AdminShellProps) {
  const pathname = usePathname()
  const base = `/admin/${slug}`
  const primaryColor = organization.primaryColor || organization.metadata?.primaryColor || '#10b981'
  const tagline = organization.tagline || organization.metadata?.tagline || ''
  const nav = NAV_ITEMS.filter((item) => item.roles.includes(role))

  function handleLogout() {
    logoutAction(slug).then(() => window.location.reload())
  }

  return (
    <div className="bg-grid flex min-h-dvh flex-col" style={{ '--neon': primaryColor } as React.CSSProperties}>
      <header className="glass-blur sticky top-0 z-20 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <Link href={base} className="flex min-w-0 items-center gap-2.5">
            {organization.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={organization.logoUrl} alt={organization.name} className="size-8 rounded-lg object-cover" />
            ) : (
              <div className="glow-neon flex size-8 shrink-0 items-center justify-center rounded-lg bg-neon text-neon-foreground"><Sparkles className="size-4" /></div>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold leading-tight">{organization.name}</h1>
              {tagline && <p className="hidden truncate text-[10px] text-muted-foreground sm:block">{tagline}</p>}
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const href = `${base}${item.href}`
              const isActive = item.href === '' ? pathname === base : pathname.startsWith(href)
              return (
                <Link key={item.href} href={href} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150', isActive ? 'bg-neon/15 text-neon' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                  <item.icon className="size-4" />{item.label}
                </Link>
              )
            })}
          </nav>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-red-400">
            <LogOut className="size-4 md:mr-1.5" />
            <span className="hidden md:inline">Çıkış</span>
          </Button>
        </div>
        <div className="mx-auto max-w-6xl">
          <PlatesRail visits={activeVisits} businessName={organization.name} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-4 sm:px-6 sm:pb-10">{children}</main>

      <nav className="glass-blur fixed inset-x-0 bottom-0 z-20 border-t border-border/60 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, 1fr)` }}>
          {nav.map((item) => {
            const href = `${base}${item.href}`
            const isActive = item.href === '' ? pathname === base : pathname.startsWith(href)
            return (
              <Link key={item.href} href={href} className={cn('flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors duration-150', isActive ? 'text-neon' : 'text-muted-foreground')}>
                <item.icon className="size-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}