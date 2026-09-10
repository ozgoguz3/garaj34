// Platform seviyesinde hizmet kataloğu ve sinyal ağırlıkları.
// AĞIRLIK ≠ PARA. Ağırlık = "bu hizmet müşteri davranışı hakkında ne kadar güçlü sinyal?"
// Merkezi yönetilir; işletme değiştiremez.
export type ServiceTier = 'rutin' | 'bakim' | 'detay' | 'boya' | 'koruma' | 'film' | 'ppf'
export type CatalogService = { name: string; weight: number; tier: ServiceTier }

export const SERVICE_CATALOG: CatalogService[] = [
  { name: 'Dış Yıkama', weight: 1, tier: 'rutin' },
  { name: 'İç Temizlik', weight: 1, tier: 'rutin' },
  { name: 'İç + Dış Yıkama', weight: 2, tier: 'rutin' },
  { name: 'Premium Yıkama', weight: 2, tier: 'rutin' },
  { name: 'Jant & Lastik Bakımı', weight: 2, tier: 'bakim' },
  { name: 'Motor Temizliği', weight: 3, tier: 'bakim' },
  { name: 'Koltuk & Döşeme Detayı', weight: 4, tier: 'bakim' },
  { name: 'Ozon & Klima Dezenfeksiyon', weight: 4, tier: 'detay' },
  { name: 'Detaylı İç Temizlik', weight: 7, tier: 'detay' },
  { name: 'Full Detailing', weight: 9, tier: 'detay' },
  { name: 'Pasta & Cila', weight: 12, tier: 'boya' },
  { name: 'Boya Correction', weight: 14, tier: 'boya' },
  { name: 'Cam Koruma / Su İtici', weight: 5, tier: 'koruma' },
  { name: 'Seramik Kaplama', weight: 20, tier: 'koruma' },
  { name: 'Cam Filmi', weight: 12, tier: 'film' },
  { name: 'PPF Kaplama', weight: 24, tier: 'ppf' },
]

export const CUSTOM_SERVICE_WEIGHT = 3
export const PROTECTION_SERVICES = ['Seramik Kaplama', 'PPF Kaplama', 'Cam Filmi', 'Cam Koruma / Su İtici']
export const PAINT_SERVICES = ['Pasta & Cila', 'Boya Correction']

export const TIER_LABELS: Record<ServiceTier, string> = {
  rutin: 'Yıkama', bakim: 'Bakım', detay: 'Detay', boya: 'Boya', koruma: 'Koruma', film: 'Cam Filmi', ppf: 'PPF',
}

export function weightOf(service: string): number {
  const hit = SERVICE_CATALOG.find((s) => s.name === service)
  return hit ? hit.weight : CUSTOM_SERVICE_WEIGHT
}
export function visitWeight(services: string[]): number {
  return (services || []).reduce((a, s) => a + weightOf(s), 0)
}
export function valueTier(totalWeight: number): { label: string; tone: 'muted' | 'cyan' | 'neon' | 'gold' } {
  if (totalWeight >= 50) return { label: 'Stratejik', tone: 'gold' }
  if (totalWeight >= 25) return { label: 'Yüksek Değer', tone: 'neon' }
  if (totalWeight >= 10) return { label: 'Düzenli', tone: 'cyan' }
  return { label: 'Rutin', tone: 'muted' }
}
export type BehaviorSegment = 'active' | 'watch' | 'winback_high' | 'at_risk' | 'dormant'
export function behaviorSegment(totalWeight: number, daysSince: number, avgCycleDays: number | null): BehaviorSegment {
  const cycle = avgCycleDays && avgCycleDays > 0 ? avgCycleDays : 45
  if (daysSince <= Math.max(cycle, 21)) return 'active'
  if (daysSince <= cycle * 1.5) return 'watch'
  if (totalWeight >= 25) return 'winback_high'
  if (daysSince > 120 || daysSince > cycle * 3) return 'dormant'
  return 'at_risk'
}
export const SEGMENT_META: Record<BehaviorSegment, { label: string; dot: string; text: string }> = {
  active: { label: 'Aktif', dot: 'bg-ok', text: 'text-ok' },
  watch: { label: 'İzlemede', dot: 'bg-gold', text: 'text-gold' },
  winback_high: { label: 'Yüksek Öncelikli Geri Kazanım', dot: 'bg-red-400', text: 'text-red-400' },
  at_risk: { label: 'Kayıp Riski', dot: 'bg-cyan', text: 'text-cyan' },
  dormant: { label: 'Uyuyan', dot: 'bg-muted-foreground', text: 'text-muted-foreground' },
}