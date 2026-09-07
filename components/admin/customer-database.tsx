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
      description="Geçmiş hizmetler ve tekrar çağırma."
      action={
        <Badge variant="outline" className="gap-1 font-mono text-muted-foreground">
          <Users className="size-3" />
          {archive.length}
        </Badge>
      }
    >
      <ul className="flex flex-col divide-y divide-border">
        {archive.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="flex min-w-0 items-center gap-4">
              <LicensePlate plate={c.plate} />
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{c.customerName}</span>
                <time dateTime={c.serviceDate} className="font-mono text-xs text-muted-foreground">
                  {dateFormatter.format(new Date(c.serviceDate))}
                </time>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => recallCustomer(c.id)}
              className="border-neon/50 bg-transparent text-neon hover:border-neon hover:bg-neon/10 hover:text-neon"
            >
              <MessageCircle />
              Tekrar Çağır
            </Button>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}
