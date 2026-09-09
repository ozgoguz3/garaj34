'use client'
import { Fragment } from 'react'
import { Star, ShieldCheck, AlertTriangle, MessageCircle, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LicensePlate } from '@/components/license-plate'
import { STEPS, STATUS_INDEX } from '@/lib/jobs-store'
import type { Visit } from '@/lib/data'
import { cn } from '@/lib/utils'

const timeFmt = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' })

type TrackingViewProps = {
  visit: Visit
  businessName?: string
  primaryColor?: string
  logoUrl?: string | null
  googleMapsUrl?: string | null
  whatsappPhone?: string | null
}

export function TrackingView({
  visit,
  businessName = 'Garaj34 Premium Detailing',
  primaryColor,
  logoUrl,
  googleMapsUrl,
  whatsappPhone,
}: TrackingViewProps) {
  const idx = STATUS_INDEX[visit.status] ?? 0
  const isReady = visit.status === 'ready' || visit.status === 'completed'
  const firstName = visit.customerName ? visit.customerName.split(' ')[0] : 'Değerli Müşterimiz'
  const waLink = whatsappPhone
    ? `https://wa.me/${whatsappPhone.replace(/\D/g, '').replace(/^0/, '90')}?text=${encodeURIComponent('Merhaba, aracım hakkında bilgi almak istiyorum.')}`
    : ''

  return (
    <main className="bg-grid relative min-h-dvh overflow-hidden pb-16" style={primaryColor ? ({ '--neon': primaryColor } as React.CSSProperties) : undefined}>
      <div className="relative mx-auto flex w-full max-w-md flex-col gap-7 px-5 pt-10">
        <header className="flex flex-col items-center gap-4 text-center">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={businessName} className="size-14 rounded-xl border border-border object-cover" />
          )}
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{businessName}</p>
          <LicensePlate plate={visit.plate || 'BİLİNMEYOR'} size="lg" className="shadow-2xl" />
          {visit.carModel && <p className="text-sm text-muted-foreground">{visit.carModel}</p>}
        </header>

        {/* Yatay ilerleme ibresi */}
        <section className="docket p-5 pl-7">
          <div className="mb-5 flex items-center justify-between">
            <span className={cn('flex items-center gap-1.5 text-xs font-medium', isReady ? 'text-ok' : 'text-cyan')}>
              <span className={cn('size-1.5 rounded-full', isReady ? 'bg-ok' : 'bg-cyan animate-pulse')} />
              {isReady ? 'Aracınız hazır' : 'İşleminiz sürüyor'}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">{Math.min(idx + 1, 3)}/3</span>
          </div>
          <div className="flex items-center px-1">
            {STEPS.map((s, i) => (
              <Fragment key={s.key}>
                <span className={cn(
                  'size-3.5 shrink-0 rounded-full border-2 transition-colors',
                  isReady ? 'border-ok bg-ok' : i <= idx ? 'border-cyan bg-cyan' : 'border-border bg-transparent',
                  i === idx && !isReady && 'ring-4 ring-cyan/20',
                )} />
                {i < STEPS.length - 1 && (
                  <span className={cn('mx-1.5 h-0.5 flex-1 rounded-full', isReady ? 'bg-ok/60' : i < idx ? 'bg-cyan' : 'bg-border')} />
                )}
              </Fragment>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 text-center">
            {STEPS.map((s, i) => (
              <span key={s.key} className={cn('text-[11px] font-medium', isReady ? 'text-ok' : i <= idx ? 'text-cyan' : 'text-muted-foreground')}>
                {s.adminLabel}
              </span>
            ))}
          </div>
          {isReady && (
            <div className="mt-5 flex items-center justify-center">
              <span className="glow-ok rounded-md border border-ok/40 bg-ok/10 px-4 py-1.5 font-mono text-sm font-bold tracking-[0.25em] text-ok">HAZIR</span>
            </div>
          )}
        </section>

        {/* Bilgi fişi */}
        <section className="docket divide-y divide-border/60 text-sm">
          <Row label="Müşteri" value={`Sayın ${firstName}`} />
          <Row label="Hizmet" value={visit.services?.length ? visit.services.join(', ') : '—'} />
          <Row label="Giriş saati" value={timeFmt.format(new Date(visit.createdAt))} mono />
          {!isReady && <Row label="Tahmini süre" value="~3 saat" mono />}
          <Row label="Atölye" value={businessName} />
        </section>

        {visit.damageNote && (
          <section className="docket flex items-start gap-2.5 border-gold/30 bg-gold/5 p-4 pl-6 text-sm text-gold">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p><span className="font-semibold">Teslim alma notu: </span>{visit.damageNote}</p>
          </section>
        )}

        {isReady && (
          <section className="flex flex-col items-center gap-4 pt-2 text-center">
            <div className="flex gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-6 fill-gold text-gold" style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Hizmetimizden memnun kaldıysanız bizi değerlendirmeniz çok değerli.</p>
            {googleMapsUrl && (
              <Button className="h-12 w-full border-neon/40 bg-transparent text-neon hover:bg-neon/10" render={<a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" />}>
                <MapPin className="mr-2 size-4" /> Google&apos;da Değerlendirin
              </Button>
            )}
          </section>
        )}

        {waLink && (
          <Button className="h-13 w-full bg-ok py-3.5 text-base font-bold text-ok-foreground hover:brightness-110" render={<a href={waLink} target="_blank" rel="noopener noreferrer" />}>
            <MessageCircle className="mr-2 size-5" /> WhatsApp&apos;tan Sor
          </Button>
        )}

        <footer className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-neon" /> {businessName} · canlı takip
        </footer>
      </div>
    </main>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 pl-6">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('text-right font-medium', mono && 'font-mono')}>{value}</span>
    </div>
  )
}