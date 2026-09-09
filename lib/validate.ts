import { normalizePlate } from '@/lib/jobs-store'

export type VisitInput = {
  customerName?: string; plate: string; carModel?: string; phone?: string
  services: string[]; warrantyMonths?: number; damageNote?: string; internalNote?: string
  price?: number | null; paymentStatus?: string
}

export function validateVisit(input: VisitInput): { ok: true; value: VisitInput } | { ok: false; error: string } {
  const plate = normalizePlate(input.plate || '')
  if (!/^\d{2} [A-Z]{1,3} \d{2,5}$/.test(plate)) return { ok: false, error: 'Plaka geçersiz. Örnek: 34 ABC 123' }
  const digits = (input.phone || '').replace(/\D/g, '')
  if (digits && digits.length < 10 || digits.length > 12) return { ok: false, error: 'Telefon numarası geçersiz.' }
  if (!Array.isArray(input.services) || input.services.length === 0 || input.services.length > 12)
    return { ok: false, error: 'En az 1, en fazla 12 hizmet seçin.' }
  const clean = (s: string | undefined, max = 500) => (s || '').trim().slice(0, max) || undefined
  const price = input.price == null || !isFinite(input.price) ? null : Math.min(Math.max(Math.round(input.price * 100) / 100, 0), 1000000)
  return {
    ok: true,
    value: {
      ...input,
      plate,
      phone: digits || undefined,
      customerName: clean(input.customerName, 80),
      carModel: clean(input.carModel, 60),
      damageNote: clean(input.damageNote),
      internalNote: clean(input.internalNote),
      price,
    },
  }
}