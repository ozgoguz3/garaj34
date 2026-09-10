// lib/catalog.ts
export type ServiceTier = 'rutin' | 'bakim' | 'detay' | 'boya' | 'koruma' | 'film' | 'ppf'
export type CatalogService = { name: string; weight: number; tier: ServiceTier }

export const SERVICE_CATALOG: CatalogService[] = [
  { name: 'Dış Yıkama', weight: 1, tier: 'rutin' },
  { name: 'İç Temizlik', weight: 1, tier: 'rutin' },
  { name: 'İç + Dış Yıkama', weight: 2, tier: 'rutin' },
  { name: 'Premium Yıkama', weight: 2, tier: 'rutin' },
  { name: 'Motor Temizliği', weight: 3, tier: 'bakim' },
  { name: 'Detaylı İç Temizlik', weight: 7, tier: 'detay' },
  { name: 'Pasta & Cila', weight: 12, tier: 'boya' },
  { name: 'Seramik Kaplama', weight: 20, tier: 'koruma' },
  { name: 'Cam Filmi', weight: 12, tier: 'film' },
  { name: 'PPF Kaplama', weight: 24, tier: 'ppf' },
]

export const CUSTOM_SERVICE_WEIGHT = 3
export const PROTECTION_SERVICES = ['Seramik Kaplama', 'PPF Kaplama', 'Cam Filmi', 'Cam Koruma / Su İtici']
export const PAINT_SERVICES = ['Pasta & Cila', 'Boya Correction']
export const TIER_LABELS: Record<ServiceTier, string> = { rutin: 'Yıkama', bakim: 'Bakım', detay: 'Detay', boya: 'Boya', koruma: 'Koruma', film: 'Cam Filmi', ppf: 'PPF' }

export function weightOf(service: string): number {
  const hit = SERVICE_CATALOG.find((s) => s.name === service)
  return hit ? hit.weight : CUSTOM_SERVICE_WEIGHT
}

export function visitWeight(services: string[]): number { return (services || []).reduce((a, s) => a + weightOf(s), 0) }

export function valueTier(totalWeight: number): { label: string; tone: 'muted' | 'cyan' | 'neon' | 'gold' } {
  if (totalWeight >= 50) return { label: 'Stratejik', tone: 'gold' }
  if (totalWeight >= 25) return { label: 'Yüksek Değer', tone: 'neon' }
  if (totalWeight >= 10) return { label: 'Düzenli', tone: 'cyan' }
  return { label: 'Rutin', tone: 'muted' }
}