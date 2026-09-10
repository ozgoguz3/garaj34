// app/page.tsx
import { LicensePlate } from '@/components/license-plate'

const FEATURES = ['Çoklu işleme', 'Canlı takip linki', 'WhatsApp entegrasyonu', 'Müşteri sadakati analizi']

export default function HomePage() {
  return (
    <main className="bg-grid flex min-h-dvh flex-col">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <span className="font-display text-sm font-bold tracking-tight">
            garaj<span className="text-neon">34</span>
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">atölye yönetim sistemi</span>
        </div>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <LicensePlate plate="34 GRJ 34" size="lg" className="shadow-2xl" />
        <h1 className="font-display mt-10 max-w-2xl text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Atölyeni <span className="text-neon">enstrüman</span> hassasiyetiyle yönet.
        </h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Garaj34 — detaylı bakım ve kaplama atölyeleri için canlı araç takibi ve müşteri yönetim sistemi.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {FEATURES.map((f) => (
            <span key={f} className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
              {f}
            </span>
          ))}
        </div>
      </div>
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 font-mono text-[11px] text-muted-foreground">
          <span>© {new Date().getFullYear()} garaj34</span>
          <span>tr · v3</span>
        </div>
      </footer>
    </main>
  )
}