// components/admin/admin-app.tsx
'use client'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Users, Megaphone, BarChart3, Settings, LogOut, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlatesRail } from '@/components/admin/plates-rail'
import { NewJobForm } from '@/components/admin/new-job-form'
import { ActiveJobs } from '@/components/admin/active-jobs'
import { CommandCenter } from '@/components/admin/command-center'
import { Customer360 } from '@/components/admin/customer-360'
import { CampaignBuilder } from '@/components/admin/campaign-builder'
import { AnalizView } from '@/components/admin/analiz-view'
import { BrandingForm } from '@/components/admin/branding-form'
import { logoutAction } from '@/lib/actions'
import type { Organization, Visit, RetentionInsight, CampaignTarget } from '@/lib/data'
import { cn } from '@/lib/utils'

type TabKey = 'panel' | 'musteriler' | 'kampanya' | 'analiz' | 'ayarlar'
const TABS: { key: TabKey; label: string; icon: any; roles: string[] }[] = [
  { key: 'panel', label: 'Panel', icon: LayoutDashboard, roles: ['boss', 'employee'] },
  { key: 'musteriler', label: 'Müşteriler', icon: Users, roles: ['boss', 'employee'] },
  { key: 'kampanya', label: 'Kampanya', icon: Megaphone, roles: ['boss'] },
  { key: 'analiz', label: 'Analiz', icon: BarChart3, roles: ['boss'] },
  { key: 'ayarlar', label: 'Ayarlar', icon: Settings, roles: ['boss'] },
]

type Props = { organization: Organization; role: 'boss' | 'employee'; activeVisits: Visit[]; completedVisits: Visit[]; insights: RetentionInsight[]; campaignInitial: CampaignTarget[]; analiz: any }

export function AdminApp({ organization, role, activeVisits, completedVisits, insights, campaignInitial, analiz }: Props) {
  const [tab, setTab] = useState<TabKey>(() => typeof window === 'undefined' ? 'panel' : (sessionStorage.getItem('g34tab') as TabKey) || 'panel')
  useEffect(() => { sessionStorage.setItem('g34tab', tab) }, [tab])

  const nav = TABS.filter((t) => t.roles.includes(role))
  const primaryColor = organization.primaryColor || '#10b981'

  function handleLogout() { logoutAction(organization.slug).then(() => { window.location.href = `/admin/${organization.slug}` }) }

  return (
    <div className="bg-grid flex min-h-dvh flex-col md:flex-row" style={{ '--neon': primaryColor } as React.CSSProperties}>
      <aside className="glass-blur sticky top-0 z-20 hidden h-dvh w-56 shrink-0 flex-col gap-1 border-r border-border/60 p-4 md:flex">
        <div className="mb-4 flex items-center gap-2.5 px-2">
          <div className="glow-neon flex size-9 items-center justify-center rounded-lg bg-neon text-neon-foreground"><Sparkles className="size-4" /></div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight">{organization.name}</p>
            <p className="text-[10px] text-muted-foreground">Yönetim Paneli</p>
          </div>
        </div>
        {nav.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150', tab === t.key ? 'bg-neon/15 text-neon' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
            <t.icon className="size-4" />{t.label}
          </button>
        ))}
        <button onClick={handleLogout} className="mt-auto flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-red-400"><LogOut className="size-4" />Çıkış</button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass-blur sticky top-0 z-20 border-x-0 border-t-0 md:hidden">
          <div className="flex items-center justify-between px-4 py-2.5">
            <p className="truncate text-sm font-bold">{organization.name}</p>
            <Button variant="ghost" size="icon-sm" onClick={handleLogout} className="text-muted-foreground"><LogOut className="size-4" /></Button>
          </div>
          <PlatesRail visits={activeVisits} businessName={organization.name} />
        </header>
        
        <div className="hidden md:block"><PlatesRail visits={activeVisits} businessName={organization.name} /></div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-10">
          {tab === 'panel' && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
              <div className="flex flex-col gap-5">
                <CommandCenter activeVisits={activeVisits} completedVisits={completedVisits} businessName={organization.name} />
                <NewJobForm organizationId={organization.id} businessSlug={organization.slug} />
                <ActiveJobs visits={activeVisits} organizationId={organization.id} businessSlug={organization.slug} />
              </div>
              <div className="lg:sticky lg:top-24 lg:self-start">
                <Customer360 completedVisits={completedVisits} businessSlug={organization.slug} />
              </div>
            </div>
          )}
          {tab === 'musteriler' && <Customer360 completedVisits={completedVisits} businessSlug={organization.slug} />}
          {tab === 'kampanya' && <CampaignBuilder businessId={organization.id} businessSlug={organization.slug} initialData={campaignInitial} />}
          {tab === 'analiz' && <AnalizView data={analiz} />}
          {tab === 'ayarlar' && <BrandingForm organization={organization} slug={organization.slug} />}
        </main>
      </div>

      <nav className="glass-blur fixed inset-x-0 bottom-0 z-20 border-t border-border/60 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, 1fr)` }}>
          {nav.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors duration-150', tab === t.key ? 'text-neon' : 'text-muted-foreground')}>
              <t.icon className="size-5" />{t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}