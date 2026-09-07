'use client'

import { MessageCircle, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LicensePlate } from '@/components/license-plate'
import { SectionCard } from '@/components/admin/section-card'
import { useJobs } from '@/lib/jobs-store'

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function CustomerDatabase({ className }: { className?: string }) {
  const { archive, recallCustomer } = useJobs()

  return (
    <SectionCard
      className={className}
      title="Müşteri Veritabanı"
      description="Geçmiş işlemler ve yeniden pazarlama."
      action={
        <Badge variant="outline" className="gap-1 font-mono text-muted-foreground">
          <Users className="size-3" />
          {archive.length}
        </Badge>
      }
    >
      {archive.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          Henüz geçmiş kayıt bulunmuyor.
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {archive.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-4 sm:items-center">
                <div className="mt-1 sm:mt-0">
                  <LicensePlate plate={c.plate} />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate font-semibold">{c.customerName}</span>
                  <time dateTime={c.serviceDate} className="font-mono text-xs text-muted-foreground">
                    {dateFormatter.format(new Date(c.serviceDate))}
                  </time>
                  {/* Yapılan İşlemler Etiketleri */}
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => recallCustomer(c.id)}
                className="w-full border-neon/50 bg-transparent text-neon hover:border-neon hover:bg-neon/10 hover:text-neon sm:w-auto"
              >
                <MessageCircle className="mr-2 size-4" />
                Tekrar Çağır
              </Button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}