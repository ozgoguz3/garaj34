export type StepIndex = 0 | 1 | 2

// Finans/Para tipleri tamamen kaldırıldı!
export type Job = {
  id: string
  businessId: string
  customerName: string
  plate: string
  phone: string
  services: string[]
  step: StepIndex
  warrantyEndDate: string | null
  createdAt: string
  carModel?: string | null
  damageNote?: string | null
  customerNotes?: string | null
}

export type ArchivedJob = {
  id: string
  businessId: string
  customerName: string
  plate: string
  phone: string
  services: string[]
  warrantyEndDate: string | null
  serviceDate: string
  carModel?: string | null
  damageNote?: string | null
  customerNotes?: string | null
}

export const WARRANTY_ELIGIBLE_SERVICES = ['Seramik Kaplama', 'Kaput Filmi', 'Cam Filmi'] as const

export const STEPS = [
  {
    key: 'queued',
    adminLabel: 'Sırada',
    title: 'Sırada Bekliyor',
    description: 'Aracınız teslim alındı, sıraya eklendi.',
  },
  {
    key: 'processing',
    adminLabel: 'İşlemde',
    title: 'İşleme Alındı',
    description: 'Seçtiğiniz hizmetler özenle uygulanıyor.',
  },
  {
    key: 'ready',
    adminLabel: 'Hazır!',
    title: 'Teslime Hazır!',
    description: 'Aracınızın işlemleri tamamlandı, sizi bekliyor.',
  },
] as const

export function normalizePlate(input: string) {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/^(\d{2})([A-Z]{1,3})(\d{2,5})$/, '$1 $2 $3')
}

export function plateToSlug(plate: string) {
  return plate.replace(/\s+/g, '').toUpperCase()
}

export function buildWhatsAppLink(phone: string, plate: string, businessSlug: string, origin: string) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  const intl = digits.startsWith('0') ? `90${digits.slice(1)}` : digits.startsWith('90') ? digits : `90${digits}`
  const url = `${origin}/${businessSlug}/${plateToSlug(plate)}`
  const text = `Merhaba! Aracınız işleme alındı. Canlı takip linkiniz: ${url}`
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`
}