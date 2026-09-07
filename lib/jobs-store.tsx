// Bu dosya artık veri tutmuyor (Context/Provider kaldırıldı) — sadece
// birden fazla yerde kullanılan saf yardımcı fonksiyonları ve tipleri
// barındırıyor. Gerçek veri artık lib/data.ts üzerinden veritabanından geliyor.

export type StepIndex = 0 | 1 | 2

export type Job = {
  id: string
  businessId: string
  customerName: string
  plate: string
  phone: string
  services: string[]
  step: StepIndex
  createdAt: string
}

export type ArchivedJob = {
  id: string
  businessId: string
  customerName: string
  plate: string
  phone: string
  services: string[]
  serviceDate: string
}

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
  const digits = phone.replace(/\D/g, '')
  const intl = digits.startsWith('0') ? `90${digits.slice(1)}` : digits
  const url = `${origin}/${businessSlug}/${plateToSlug(plate)}`
  const text = `Merhaba! Aracınız işleme alındı. Canlı takip: ${url}`
  return phone ? `https://wa.me/${intl}?text=${encodeURIComponent(text)}` : ''
}
