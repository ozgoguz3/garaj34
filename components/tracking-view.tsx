'use client'

import Link from 'next/link'
import { Sparkles, Star, ShieldCheck, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LicensePlate } from '@/components/license-plate'
import { StatusTracker } from '@/components/status-tracker'
import { STEPS, type Job } from '@/lib/jobs-store'

type TrackingViewProps = {
  job: Job
  businessName?: string
  primaryColor?: string
  logoUrl?: string | null
}

export function TrackingView({
  job,
  businessName = 'Garaj34 Premium Detailing',
  primaryColor,
  logoUrl,
}: TrackingViewProps) {
  const current = STEPS[job.step]

  return (
    <main
      className="bg-grid relative min-h-dvh overflow-hidden"
      style={primaryColor ? ({ '--neon': primaryColor } as React.CSSProperties) : undefined}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.18),transparent_65%)]"
      />

      <div className="relative mx-auto flex w-full max-w-md flex-col gap-8 px-5 pb-12 pt-8">
        <header className="flex flex-col items-center gap-3 text-center">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={businessName} className="size-14 rounded-xl object-cover" />
          )}
          <Badge className="glow-neon gap-1.5 border-neon/40 bg-neon/15 px-3 py-1 text-neon">
            <Sparkles className="size-3.5" />
            Canlı Takip
          </Badge>
          <h1 className="text-balance text-2xl font-bold tracking-tight">
            {businessName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Merhaba {job.customerName.split(' ')[0]}, aracınız güvenli ellerde.
          </p>
        </header>

        <section className="flex flex-col items-center gap-4" aria-labelledby="plate-heading">
          <h2 id="plate-heading" className="sr-only">
            Araç Plakası
          </h2>
          <LicensePlate plate={job.plate} size="lg" className="shadow-2xl" />
          
          {/* Seçilen Hizmetler Rozeti */}
          {job.services && job.services.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {job.services.map((s, i) => (
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

          <div className="flex items-center gap-2 pt-1 text-sm">
            <span className="text-muted-foreground">Güncel durum:</span>
            <span className="text-glow-neon font-semibold text-neon">{current.title}</span>
          </div>
        </section>

        <section className="glass rounded-2xl p-6" aria-labelledby="progress-heading">
          <div className="mb-6 flex items-center justify-between">
            <h2 id="progress-heading" className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              İşlem Adımları
            </h2>
            <span className="font-mono text-xs text-cyan">
              {job.step + 1}/{STEPS.length}
            </span>
          </div>
          <StatusTracker step={job.step} />
        </section>

        <section className="flex flex-col items-center gap-5 pt-2 text-center" aria-labelledby="review-heading">
          <div className="flex gap-1.5" aria-label="5 yıldız">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="size-7 fill-gold text-gold drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]"
              />
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <h2 id="review-heading" className="text-lg font-semibold">
              Deneyiminizden memnun kaldınız mı?
            </h2>
            <p className="text-sm text-muted-foreground">
              Bir dakikanızı ayırarak bizi destekleyin.
            </p>
          </div>
          <Button
            size="lg"
            className="glow-neon h-14 w-full rounded-xl bg-neon text-base font-bold text-neon-foreground transition-transform hover:scale-[1.02] hover:bg-neon active:scale-[0.99]"
            render={
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName)}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            Bizi Google&apos;da Değerlendirin
          </Button>
        </section>

        <footer className="flex flex-col items-center gap-2 pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-neon" />
            {businessName}
          </span>
        </footer>
      </div>
    </main>
  )
}