import type { VisitStatus } from '@/lib/data'

export const WARRANTY_ELIGIBLE_SERVICES = ['Seramik Kaplama', 'PPF Kaplama', 'Cam Filmi'] as const

export type StepConfig = {
  key: VisitStatus
  adminLabel: string
  title: string
  description: string
}

export const STEPS: StepConfig[] = [
  { key: 'queued', adminLabel: 'Sırada', title: 'Sırada Bekliyor', description: 'Aracınız teslim alındı, sıraya eklendi.' },
  { key: 'processing', adminLabel: 'İşlemde', title: 'İşleme Alındı', description: 'Seçtiğiniz hizmetler özenle uygulanıyor.' },
  { key: 'ready', adminLabel: 'Hazır!', title: 'Teslime Hazır!', description: 'Aracınızın işlemleri tamamlandı, sizi bekliyor.' },
]

export const STATUS_INDEX: Record<VisitStatus, number> = {
  queued: 0, processing: 1, ready: 2, completed: 3, cancelled: 4,
}

export function normalizePlate(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^(\d{2})([A-Z]{1,3})(\d{2,5})$/, '$1 $2 $3')
}
export function plateToSlug(plate: string) {
  return plate.replace(/\s+/g, '').toUpperCase()
}
export function formatPlateLive(raw: string): string {
  const t = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
  const m = t.match(/^(\d{0,2})([A-Z]{0,3})(\d{0,5})$/)
  if (!m) return t
  const [, d, l, n] = m
  return [d, l, n].filter(Boolean).join(' ')
}
export function buildWhatsAppLink(phone: string | undefined | null, plate: string, businessSlug: string, origin: string) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  const intl = digits.startsWith('0') ? `90${digits.slice(1)}` : digits.startsWith('90') ? digits : `90${digits}`
  const url = `${origin}/${businessSlug}/${plateToSlug(plate)}`
  const text = `Merhaba! Aracınız işleme alındı. Canlı takip linkiniz: ${url}`
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`
}