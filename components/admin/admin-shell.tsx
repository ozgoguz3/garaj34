'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, CarFront, Users, Megaphone, Settings, LogOut, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logoutAction } from '@/lib/actions'
import type { Organization } from '@/lib/data'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '', label: 'Panel', icon: LayoutDashboard, roles: ['boss'] },
  { href: '/aktif', label: 'Aktif İşler', icon: CarFront, roles: ['boss', 'employee'] },
  { href: '/musteriler', label: 'Müşteriler', icon: Users, roles: ['boss', 'employee'] },
  { href: '/kampanya', label: 'Kampanya', icon: Megaphone, roles: ['boss'] },
  { href: '/ayarlar', label: 'Ayarlar', icon: Settings, roles: ['boss'] },
]

type AdminShellProps = { organization: Organization; slug: string; role?: 'boss' | 'employee'; children: React.ReactNode }

export function AdminShell({ organization, slug, role = 'boss', children }: AdminShellProps) {
  const pathname = usePathname()
  const base = `/admin/${slug}`
  const primaryColor = organization.primaryColor || '#4c8df6'
  const allowed = NAV_ITEMS.filter((i) => i.roles.includes(role))

  function handleLogout() { logoutAction(slug).then(() => window.location.reload()) }

  return (
    <div className="bg-grid flex min-h-dvh flex-col" style={{ '--neon': primaryColor } as React.CSSProperties}>
      <header className="sticky top-0 z-20 border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href={base} className="flex min-w-0 items-center gap-2.5">
            {organization.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={organization.logoUrl} alt={organization.name} className="size-8 rounded-md border border-border object-cover" />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-md border border-neon/30 bg-neon/10 text-neon"><Wrench className="size-4" /></span>
            )}
            <span className="min-w-0">
              <span className="font-display block truncate text-sm font-bold leading-tight">{organization.name}</span>
              {organization.tagline && <span className="hidden truncate text-[11px] text-muted-foreground sm:block">{organization.tagline}</span>}
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {allowed.map((item) => {
              const href = `${base}${item.href}`
              const isActive = item.href === '' ? pathname === base : pathname.startsWith(href)
              return (
                <Link key={item.href} href={href}
                  className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150',
                    isActive ? 'bg-neon/10 text-neon' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                  <item.icon className="size-4" />{item.label}
                </Link>
              )
            })}
          </nav>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-red-400">
            <LogOut className="size-4 md:mr-1.5" /><span className="hidden md:inline">Çıkış</span>
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 sm:pb-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${allowed.length}, 1fr)` }}>
          {allowed.map((item) => {
            const href = `${base}${item.href}`
            const isActive = item.href === '' ? pathname === base : pathname.startsWith(href)
            return (
              <Link key={item.href} href={href}
                className={cn('flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors', isActive ? 'text-neon' : 'text-muted-foreground')}>
                <item.icon className="size-5" />{item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}