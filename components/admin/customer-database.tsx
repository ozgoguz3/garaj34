'use client'

import { useState } from 'react'
import { MessageCircle, Users, Calendar, History, X, Car, TrendingDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LicensePlate } from '@/components/license-plate'
import { SectionCard } from '@/components/admin/section-card'
import { buildWhatsAppLink } from '@/lib/jobs-store'
import type { ArchivedJob } from '@/lib/jobs-store'
import type { RetentionInsight } from '@/lib/data'

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

type FilterType = 'all' | 'week' | 'month'

type CustomerDatabaseProps = {
  archive: ArchivedJob[]
  insights: RetentionInsight[]
  businessSlug: string
  className?: string
}

export function CustomerDatabase({ archive, insights, businessSlug, className }: CustomerDatabaseProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedPlateForModal, setSelectedPlateForModal] = useState<string | null>(null)

  const filteredArchive = archive.filter((item) => {
    if (filter === 'all') return true
    const itemDate = new Date(item.serviceDate).getTime()
    const now = new Date().getTime()
    const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24)

    if (filter === 'week') return diffDays <= 7
    if (filter === 'month') return diffDays <= 30
    return true
  })

  const modalHistory = selectedPlateForModal
    ? archive.filter((a) => a.plate === selectedPlateForModal)
    : []

  function recall(phone: string, plate: string) {
    const link = buildWhatsAppLink(phone, plate, businessSlug, window.location.origin)
    if (link) window.open(link, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      {insights.length > 0 && (
        <SectionCard
          className={className ? `${className} mb-6` : 'mb-6'}
          title="Geri Kazanım Adayları"
          description="Eskiden düzenli gelip son zamanlarda uğramayan müşteriler."
          action={
            <Badge variant="outline" className="gap-1 border-amber-500/40 font-mono text-amber-400">
              <TrendingDown className="size-3" />
              {insights.length}
            </Badge>
          }
        >
          <ul className="flex flex-col gap-2">
            {insights.slice(0, 5).map((c) => (
              <li
                key={c.plate}
                className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">{c.customerName}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Son ziyaret: {dateFormatter.format(new Date(c.lastVisit))} · {c.visitCount} ziyaret
                  </span>
                </div>
                {c.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => recall(c.phone, c.plate)}
                    className="shrink-0 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-400"
                  >
                    <MessageCircle className="mr-1.5 size-3.5" />
                    Ulaş
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard
        className={className}
        title="Müşteri Veritabanı"
        description="Geçmiş işlemler, filtreleme ve ziyaret geçmişi."
        action={
          <Badge variant="outline" className="gap-1 font-mono text-muted-foreground">
            <Users className="size-3" />
            {archive.length}
          </Badge>
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              filter === 'all' ? 'bg-cyan/15 text-cyan border border-cyan/30' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Tümü ({archive.length})
          </button>
          <button
            onClick={() => setFilter('week')}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              filter === 'week' ? 'bg-cyan/15 text-cyan border border-cyan/30' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Bu Hafta
          </button>
          <button
            onClick={() => setFilter('month')}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              filter === 'month' ? 'bg-cyan/15 text-cyan border border-cyan/30' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Bu Ay
          </button>
        </div>

        {filteredArchive.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Seçilen aralıkta kayıt bulunmuyor.
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {filteredArchive.map((c) => {
              const totalVisits = archive.filter((a) => a.plate === c.plate).length

              return (
                <li
                  key={c.id}
                  onClick={() => setSelectedPlateForModal(c.plate)}
                  className="group flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between cursor-pointer rounded-lg px-2 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start gap-4 sm:items-center">
                    <div className="mt-1 sm:mt-0">
                      <LicensePlate plate={c.plate} />
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold">{c.customerName}</span>
                        {totalVisits > 1 && (
                          <span className="rounded-full bg-cyan/10 px-2 py-0.5 text-[10px] font-mono text-cyan border border-cyan/20">
                            {totalVisits}. Ziyaret
                          </span>
                        )}
                      </div>
                      <time dateTime={c.serviceDate} className="font-mono text-xs text-muted-foreground">
                        {dateFormatter.format(new Date(c.serviceDate))}
                      </time>

                      {c.services && c.services.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {c.services.map((s, i) => (
                            <span key={i} className="rounded bg-secondary/50 px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        recall(c.phone, c.plate)
                      }}
                      className="w-full border-neon/50 bg-transparent text-neon hover:border-neon hover:bg-neon/10 hover:text-neon sm:w-auto"
                    >
                      <MessageCircle className="mr-2 size-4" />
                      Tekrar Çağır
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </SectionCard>

      {selectedPlateForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-border bg-background p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-cyan/10 text-cyan">
                  <Car className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Müşteri Ziyaret Geçmişi</h3>
                  <p className="font-mono text-xs text-muted-foreground">{selectedPlateForModal}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPlateForModal(null)}
                className="size-8 p-0"
              >
                <X className="size-5" />
              </Button>
            </div>

            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
              <p className="text-xs text-muted-foreground">
                Bu aracın toplam <span className="font-bold text-foreground">{modalHistory.length}</span> kayıtlı hizmet geçmişi bulunmaktadır:
              </p>

              {modalHistory.map((historyItem, idx) => (
                <div key={historyItem.id} className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="size-3.5" />
                      {dateFormatter.format(new Date(historyItem.serviceDate))}
                    </span>
                    <span className="font-mono">Kayıt #{modalHistory.length - idx}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{historyItem.customerName}</span>
                    <span className="font-mono text-xs text-muted-foreground">{historyItem.phone || 'Telefon yok'}</span>
                  </div>

                  {historyItem.services && historyItem.services.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {historyItem.services.map((s, sIdx) => (
                        <span key={sIdx} className="rounded bg-neon/10 border border-neon/30 px-2 py-0.5 text-[11px] font-medium text-neon">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button
              onClick={() => setSelectedPlateForModal(null)}
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Kapat
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
