import type { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NewJobForm } from '@/components/admin/new-job-form'
import { ActiveJobs } from '@/components/admin/active-jobs'
import { CustomerDatabase } from '@/components/admin/customer-database'

export const metadata: Metadata = {
  title: 'Garaj34 Yönetim Paneli',
  description: 'Premium Oto Detaylama - Mini CRM',
}

export default function AdminPage() {
  return (
    <div className="bg-grid min-h-dvh">
      <header className="glass sticky top-0 z-10 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="glow-neon flex size-10 items-center justify-center rounded-lg bg-neon text-neon-foreground">
              <Sparkles className="size-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-tight tracking-tight">Garaj34 Yönetim Paneli</h1>
              <p className="text-xs text-muted-foreground">Premium Oto Detaylama - Mini CRM</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-cyan/40 text-cyan hover:bg-cyan/10 hover:text-cyan"
            render={<Link href="/" />}
          >
            <Smartphone />
            Müşteri Ekranı Önizleme
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <NewJobForm />
          <ActiveJobs />
        </div>
        <CustomerDatabase className="lg:sticky lg:top-24 lg:self-start" />
      </main>
    </div>
  )
}
