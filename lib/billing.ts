import type { Organization } from '@/lib/data'

export type PlanId = 'trial' | 'starter' | 'pro' | 'chain'

export type Plan = {
  id: PlanId
  name: string
  priceMonthly: number
  priceYearly: number
  lifetime: number | null
  maxActiveVisits: number
  staff: number
  campaigns: boolean
  bi: boolean
  blurb: string
  features: string[]
}

export const PLANS: Plan[] = [
  {
    id: 'trial', name: 'Deneme', priceMonthly: 0, priceYearly: 0, lifetime: null,
    maxActiveVisits: 15, staff: 1, campaigns: false, bi: false,
    blurb: '14 gün, kartsız, risksiz.',
    features: ['Canlı araç takip', 'WhatsApp linki', '15 aktif araç'],
  },
  {
    id: 'starter', name: 'Başlangıç', priceMonthly: 499, priceYearly: 4990, lifetime: 14990,
    maxActiveVisits: 60, staff: 1, campaigns: false, bi: false,
    blurb: 'Tek şube, temel operasyon.',
    features: ['Sınırsız müşteri veritabanı', 'Canlı takip + WhatsApp', 'Google yorum toplama linki', 'Garanti takibi'],
  },
  {
    id: 'pro', name: 'Pro', priceMonthly: 999, priceYearly: 9990, lifetime: 24990,
    maxActiveVisits: 500, staff: 3, campaigns: true, bi: true,
    blurb: 'Büyüyen işletmeler için tam paket.',
    features: ['Başlangıç’taki her şey', 'Kampanya & segment mesajları', 'İş zekası raporları (ciro, CLV, tekrar oranı)', '3 personel PIN’i', 'Öncelikli destek'],
  },
  {
    id: 'chain', name: 'Zincir', priceMonthly: 2499, priceYearly: 24990, lifetime: null,
    maxActiveVisits: 5000, staff: 25, campaigns: true, bi: true,
    blurb: 'Çok şubeli gruplar + benchmark.',
    features: ['Pro’daki her şey', 'Çoklu şube', 'İstanbul benchmark raporu', 'Özel renk/logo & kurulum desteği'],
  },
]

export const PLAN_MAP = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<PlanId, Plan>

export type BillingStatus = 'trial' | 'active' | 'expired'
export type BillingState = { status: BillingStatus; daysLeft: number; plan: Plan }

const DAY = 1000 * 60 * 60 * 24

export function billingState(org: Organization): BillingState {
  const plan = PLAN_MAP[(org.planId as PlanId)] ?? PLAN_MAP.trial
  const now = Date.now()
  if (org.subscriptionStatus === 'active') {
    const until = org.subscriptionRenewsAt ? new Date(org.subscriptionRenewsAt).getTime() : 0
    return until > now
      ? { status: 'active', daysLeft: Math.ceil((until - now) / DAY), plan }
      : { status: 'expired', daysLeft: 0, plan }
  }
  const until = org.trialEndsAt ? new Date(org.trialEndsAt).getTime() : 0
  return until > now
    ? { status: 'trial', daysLeft: Math.ceil((until - now) / DAY), plan }
    : { status: 'expired', daysLeft: 0, plan }
}

export const tl = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)