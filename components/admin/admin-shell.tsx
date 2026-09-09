'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, CarFront, Users, Megaphone, Settings, LogOut, Sparkles, ShieldAlert } from 'lucide-react'
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

type AdminShellProps = {
  organization: Organization
  slug: string
  role?: 'boss' | 'employee'
  children: React.ReactNode
}

export function AdminShell({ organization, slug, role = 'boss', children }: AdminShellProps) {
  const pathname = usePathname()
  const base = `/admin/${slug}`
  const primaryColor = organization.metadata?.primaryColor || '#10b981'
  const tagline = organization.metadata?.tagline || ''

  function handleLogout() {
    logoutAction(slug).then(() => window.location.reload())
  }

  const allowedNavItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <div className="bg-grid flex min-h-dvh flex-col" style={{ '--neon': primaryColor } as React.CSSProperties}>
      <header className="glass sticky top-0 z-20 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            {organization.logoUrl ? (
              <img src={organization.logoUrl} alt={organization.name} className="size-9 rounded-lg object-cover" />
            ) : (
              <div className="glow-neon flex size-9 items-center justify-center rounded-lg bg-neon text-neon-foreground"><Sparkles className="size-4.5" /></div>
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold leading-tight sm:text-base">{organization.name}</h1>
              </div>
              {tagline && <p className="hidden text-[11px] text-muted-foreground sm:block">{tagline}</p>}
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {allowedNavItems.map((item) => {
              const href = `${base}${item.href}`
              const isActive = item.href === '' ? pathname === base : pathname.startsWith(href)
              return (
                <Link key={item.href} href={href} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors', isActive ? 'bg-neon/15 text-neon' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
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
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 sm:pb-8">{children}</main>
    </div>
  )
}