// lib/billing.ts
import type { Organization } from '@/lib/data'
export type PlanId = 'trial' | 'starter' | 'pro' | 'chain'
export type Plan = { id: PlanId; name: string; priceMonthly: number; maxActiveVisits: number; features: string[] }

export const PLANS: Plan[] = [
  { id: 'trial', name: 'Deneme', priceMonthly: 0, maxActiveVisits: 15, features: [] },
  { id: 'starter', name: 'Başlangıç', priceMonthly: 499, maxActiveVisits: 60, features: [] },
  { id: 'pro', name: 'Pro', priceMonthly: 999, maxActiveVisits: 500, features: [] },
]
export const PLAN_MAP = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<PlanId, Plan>
export type BillingStatus = 'trial' | 'active' | 'expired'
export type BillingState = { status: BillingStatus; daysLeft: number; plan: Plan }

export function billingState(org: Organization): BillingState {
  const plan = PLAN_MAP[(org.planId as PlanId)] ?? PLAN_MAP.trial
  if (org.subscriptionStatus === 'active') return { status: 'active', daysLeft: 30, plan }
  return { status: 'trial', daysLeft: 14, plan }
}

export const tl = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)