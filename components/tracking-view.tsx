'use client'

import { Sparkles, Star, ShieldCheck, Wrench, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LicensePlate } from '@/components/license-plate'
import { StatusTracker } from '@/components/status-tracker'
import { STEPS, STATUS_INDEX } from '@/lib/jobs-store'
import type { Visit } from '@/lib/data'

type TrackingViewProps = {
  visit: Visit
  businessName?: string
  primaryColor?: string
  logoUrl?: string | null
  googleMapsUrl?: string | null
}

export function TrackingView({
  visit,
  businessName = 'Garaj34 Premium Detailing',
  primaryColor,
  logoUrl,
  googleMapsUrl
}: TrackingViewProps) {
  const currentIndex = STATUS_INDEX[visit.status] ?? 0
  const isCompleted = visit.status === 'completed' || visit.status === 'ready'
  
  const displayPlate = visit.plate || 'BİLİNMİYOR'
  const firstName = visit.customerName ? visit.customerName.split(' ')[0] : 'Değerli Müşterimiz'

  return (
    <main
      className="bg-grid relative min-h-dvh overflow-hidden pb-12"
      style={primaryColor ? ({ '--neon': primaryColor } as React.CSSProperties) : undefined}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.18),transparent_65%)]"
      />

      <div className="relative mx-auto flex w-full max-w-md flex-col gap-8 px-5 pt-8">
        <header className="flex flex-col items-center gap-3 text-center">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={businessName} className="size-16 rounded-2xl object-cover shadow-lg border border-white/10" />
          )}
          <Badge className="glow-neon gap-1.5 border-neon/40 bg-neon/15 px-3 py-1 text-neon">
            <Sparkles className="size-3.5" />
            Canlı Takip
          </Badge>
          <h1 className="text-balance text-2xl font-bold tracking-tight">
            {businessName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Sayın {firstName}, aracınız güvenli ellerde.
          </p>
        </header>

        <section className="flex flex-col items-center gap-4">
          <LicensePlate plate={displayPlate} size="lg" className="shadow-2xl" />
          
          {visit.carModel && (
            <div className="font-semibold text-lg text-white/90">
              {visit.carModel}
            </div>
          )}
          
          {visit.services && visit.services.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {visit.services.map((s, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 rounded-full border border-neon/30 bg-neon/10 px-3 py-1 text-xs font-medium text-neon"
                >
                  <Wrench className="size-3" />
                  {s}
                </span>
              ))}
            </div>
          )}

          {visit.damageNote && (
            <div className="mt-2 flex w-full items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-left text-sm text-amber-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <div>
                <span className="font-semibold text-amber-500">Teslim Alma Notu: </span>
                {visit.damageNote}
              </div>
            </div>
          )}
        </section>

        <section className="glass rounded-2xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              İşlem Adımları
            </h2>
            <span className="font-mono text-xs text-neon">
              {Math.min(currentIndex + 1, STEPS.length)}/{STEPS.length}
            </span>
          </div>
          <StatusTracker status={visit.status} />
        </section>

        {isCompleted && googleMapsUrl && (
          <section className="flex flex-col items-center gap-5 pt-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="size-7 fill-gold text-gold drop-shadow-[0_0_10px_rgba(251,191,36,0.6)] animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">
                Aracınız Teslimata Hazır!
              </h2>
              <p className="text-sm text-muted-foreground">
                Hizmetimizden memnun kaldıysanız bize 5 yıldız vererek destek olabilirsiniz.
              </p>
            </div>
            <Button
              size="lg"
              className="glow-neon h-14 w-full rounded-xl bg-neon text-base font-bold text-neon-foreground transition-all hover:scale-105"
              render={<a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" />}
            >
              Bizi Google'da Değerlendirin
            </Button>
          </section>
        )}

        <footer className="flex flex-col items-center gap-2 pt-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-neon" />
            {businessName} - Premium Takip Sistemi
          </span>
        </footer>
      </div>
    </main>
  )
}