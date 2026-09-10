// lib/lifecycle.ts
export type LifecycleStage = 'new' | 'active' | 'loyal' | 'at_risk' | 'high_risk' | 'dormant' | 'reactivated'
export type CustomerScore = { loyalty: number; engagement: number; opportunity: number; churnRisk: number }
export type NextBestAction = { type: 'recall' | 'upsell' | 'cross_sell' | 'warranty' | 'review' | 'loyalty'; priority: 'urgent' | 'high' | 'medium' | 'low'; reason: string; suggestedMessage?: string }

export type CustomerInsight = {
  stage: LifecycleStage
  scores: CustomerScore
  avgCycleDays: number
  daysSinceLastVisit: number
  daysOverdue: number
  nextAction: NextBestAction | null
  totalVisits: number
  totalWeight: number
  favoriteServices: string[]
  protectionGap: boolean
}

export function calculateLifecycle(totalVisits: number, totalWeight: number, daysSinceLastVisit: number, avgCycleDays: number, services: string[], hasProtection: boolean, hasPaint: boolean): CustomerInsight {
  const cycle = avgCycleDays > 0 ? avgCycleDays : 45
  const overdue = daysSinceLastVisit - cycle
  const cycleRatio = daysSinceLastVisit / cycle

  let stage: LifecycleStage
  if (totalVisits <= 1) stage = 'new'
  else if (cycleRatio <= 1.3) stage = totalWeight >= 50 ? 'loyal' : 'active'
  else if (cycleRatio <= 1.8) stage = 'at_risk'
  else if (cycleRatio <= 2.5 && totalWeight >= 25) stage = 'high_risk'
  else stage = 'dormant'

  const protectionGap = hasPaint && !hasProtection
  
  let nextAction: NextBestAction | null = null
  if (stage === 'high_risk') nextAction = { type: 'recall', priority: 'urgent', reason: `Değerli müşteri ${overdue} gün gecikti` }
  else if (protectionGap) nextAction = { type: 'cross_sell', priority: 'high', reason: 'Boya işlemi var ama koruma hizmeti yok' }

  const serviceCounts = new Map<string, number>()
  services.forEach(s => serviceCounts.set(s, (serviceCounts.get(s) || 0) + 1))
  const favoriteServices = [...serviceCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name)

  return { stage, scores: { loyalty: 50, engagement: 50, opportunity: protectionGap ? 85 : 30, churnRisk: stage === 'high_risk' ? 90 : 20 }, avgCycleDays: cycle, daysSinceLastVisit, daysOverdue: Math.max(0, overdue), nextAction, totalVisits, totalWeight, favoriteServices, protectionGap }
}

export const STAGE_META: Record<LifecycleStage, { label: string; color: 'ok' | 'neon' | 'gold' | 'red' | 'muted'; icon: string }> = {
  new: { label: 'Yeni', color: 'muted', icon: '✨' },
  active: { label: 'Aktif', color: 'ok', icon: '🟢' },
  loyal: { label: 'Sadık', color: 'neon', icon: '⭐' },
  at_risk: { label: 'Risk', color: 'gold', icon: '⚠️' },
  high_risk: { label: 'Yüksek Risk', color: 'red', icon: '🚨' },
  dormant: { label: 'Uyuyan', color: 'muted', icon: '💤' },
  reactivated: { label: 'Geri Döndü', color: 'ok', icon: '🎉' }
}