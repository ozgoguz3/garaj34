'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, CarFront, Users, Megaphone, Settings, LogOut, Sparkles, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logoutAction } from '@/lib/actions'
import type { Business } from '@/lib/data'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '', label: 'Panel', icon: LayoutDashboard, roles: ['boss'] },
  { href: '/aktif', label: 'Aktif İşler', icon: CarFront, roles: ['boss', 'employee'] },
  { href: '/musteriler', label: 'Müşteriler', icon: Users, roles: ['boss', 'employee'] },
  { href: '/kampanya', label: 'Kampanya', icon: Megaphone, roles: ['boss'] },
  { href: '/ayarlar', label: 'Ayarlar', icon: Settings, roles: ['boss'] },
]

type AdminShellProps = {
  business: Business
  slug: string
  role: 'boss' | 'employee' // YENİ: Yetki prop'u geldi
  children: React.ReactNode
}

export function AdminShell({ business, slug, role, children }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const base = `/admin/${slug}`

  function handleLogout() {
    logoutAction(slug).then(() => router.refresh())
  }

  // YENİ: Giriş yapanın yetkisine göre menüyü filtrele
  const allowedNavItems = NAV_ITEMS.filter(item => item.roles.includes(role))

  return (
    <div className="bg-grid flex min-h-dvh flex-col" style={{ '--neon': business.primaryColor } as React.CSSProperties}>
      {/* Üst header — masaüstünde görünür, mobilde sadeleşir */}
      <header className="glass sticky top-0 z-20 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            {business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logoUrl} alt={business.name} className="size-9 rounded-lg object-cover" />
            ) : (
              <div className="glow-neon flex size-9 items-center justify-center rounded-lg bg-neon text-neon-foreground">
                <Sparkles className="size-4.5" />
              </div>
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold leading-tight sm:text-base">{business.name}</h1>
                {/* Personel girişi yaptıysa ufak bir uyarı rozeti */}
                {role === 'employee' && (
                  <span className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-500">
                    <ShieldAlert className="size-3" />
                    Personel
                  </span>
                )}
              </div>
              <p className="hidden text-[11px] text-muted-foreground sm:block">{business.tagline}</p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {allowedNavItems.map((item) => {
              const href = `${base}${item.href}`
              // Tam eşleşme (Panel '') veya alt yol eşleşmesi
              const isActive = item.href === '' ? pathname === base : pathname.startsWith(href)
              return (
                <Link
                  key={item.href}
                  href={href}
                  prefetch={true} // HIZ OPTİMİZASYONU: Sayfayı arka planda önceden yükle
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-neon/15 text-neon' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
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

      {/* İçerik */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 sm:pb-8">{children}</main>

      {/* Alt navigasyon — mobilde app hissi veren asıl unsur */}
      <nav className="glass fixed inset-x-0 bottom-0 z-20 border-x-0 border-b-0 md:hidden pb-safe">
        {/* YENİ: Menüdeki eleman sayısına göre grid (Personelde 2, Patronda 5 kolon) */}
        <div className={cn("mx-auto grid max-w-6xl", role === 'employee' ? 'grid-cols-2' : 'grid-cols-5')}>
          {allowedNavItems.map((item) => {
            const href = `${base}${item.href}`
            const isActive = item.href === '' ? pathname === base : pathname.startsWith(href)
            return (
              <Link
                key={item.href}
                href={href}
                prefetch={true} // HIZ OPTİMİZASYONU
                className={cn(
                  'flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors',
                  isActive ? 'text-neon' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <item.icon className={cn('size-5', isActive && 'glow-neon-text drop-shadow-[0_0_8px_currentColor]')} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}