// lib/validate.ts
import { normalizePlate } from '@/lib/jobs-store'
export type VisitInput = { customerName?: string; plate: string; carModel?: string; phone?: string; services: string[]; warrantyMonths?: number; damageNote?: string; internalNote?: string }

export function validateVisit(input: VisitInput): { ok: true; value: VisitInput } | { ok: false; error: string } {
  const plate = normalizePlate(input.plate || '')
  if (!/^\d{2} [A-Z]{1,3} \d{2,5}$/.test(plate)) return { ok: false, error: 'Plaka geçersiz.' }
  if (!Array.isArray(input.services) || input.services.length === 0) return { ok: false, error: 'En az 1 hizmet seçin.' }
  return { ok: true, value: { ...input, plate } }
}