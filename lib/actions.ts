'use server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import * as data from '@/lib/data'
import type { VisitStatus } from '@/lib/data'
import { billingState, PLAN_MAP, type PlanId } from '@/lib/billing'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30
const authCookieName = (slug: string) => `garaj34_auth_${slug}`
const rlCookieName = (slug: string) => `garaj34_rl_${slug}`

type Result<T> = { ok: true; value: T } | { ok: false; error: string }

// --- Basit brute-force koruması: 15 dk'da 5 deneme ---
async function rateLimited(slug: string): Promise<string | null> {
  const jar = await cookies()
  const raw = jar.get(rlCookieName(slug))?.value
  if (!raw) return null
  try {
    const { n, t } = JSON.parse(raw) as { n: number; t: number }
    if (Date.now() - t < 15 * 60 * 1000 && n >= 5) return 'Çok fazla hatalı deneme. Lütfen 15 dakika sonra tekrar deneyin.'
  } catch {}
  return null
}
async function bumpRate(slug: string) {
  const jar = await cookies()
  const raw = jar.get(rlCookieName(slug))?.value
  let n = 1, t = Date.now()
  try { const p = JSON.parse(raw || '{}'); if (Date.now() - (p.t || 0) < 15 * 60 * 1000) n = (p.n || 0) + 1; else t = Date.now() } catch {}
  jar.set(rlCookieName(slug), JSON.stringify({ n, t }), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 900 })
}

export async function loginAction(slug: string, pin: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const limited = await rateLimited(slug)
  if (limited) return { ok: false, error: limited }
  const res = await data.verifyPin(slug, pin)
  if (!res) { await bumpRate(slug); return { ok: false, error: 'Hatalı PIN kodu.' } }
  const jar = await cookies()
  jar.set(authCookieName(slug), `${res.organization.id}.${res.role}`, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: COOKIE_MAX_AGE,
  })
  jar.delete(rlCookieName(slug))
  await data.logAudit(res.organization.id, res.role, 'login', 'organization', res.organization.id)
  revalidatePath(`/admin/${slug}`, 'layout')
  return { ok: true }
}

export async function logoutAction(slug: string) {
  const jar = await cookies()
  jar.delete(authCookieName(slug))
  revalidatePath(`/admin/${slug}`, 'layout')
}

export async function getAuthedOrganization(slug: string): Promise<{ organization: data.Organization; role: 'boss' | 'employee' } | null> {
  try {
    const jar = await cookies()
    const raw = jar.get(authCookieName(slug))?.value
    if (!raw) return null
    const [id, role] = raw.split('.')
    const org = await data.getOrganizationById(id)
    if (!org || org.slug !== slug) return null
    return { organization: org, role: (role === 'employee' ? 'employee' : 'boss') as 'boss' | 'employee' }
  } catch { return null }
}
export const getAuthedBusiness = getAuthedOrganization

async function requireAuth(slug: string, businessId: string) {
  const auth = await getAuthedOrganization(slug)
  if (!auth || String(auth.organization.id) !== String(businessId)) throw new Error('Yetkisiz islem. Lutfen tekrar giris yapin.')
  return auth
}

export async function addVisitAction(businessSlug: string, businessId: string, input: Parameters<typeof data.addVisit>[1]): Promise<Result<data.Visit>> {
  const auth = await requireAuth(businessSlug, businessId)
  const bill = billingState(auth.organization)
  if (bill.status === 'expired')
    return { ok: false, error: 'Abonelik süreniz doldu. Paneliniz kilitlenmedi; verileriniz güvende. Devam etmek için aboneliğinizi yenileyin.' }
  const active = await data.countActiveVisits(businessId)
  if (active >= bill.plan.maxActiveVisits)
    return { ok: false, error: `"${bill.plan.name}" planınızda aktif araç limiti (${bill.plan.maxActiveVisits}) doldu. Üst plana geçerek kapasiteyi açabilirsiniz.` }
  const visit = await data.addVisit(businessId, input)
  await data.logAudit(businessId, auth.role, 'visit.create', 'visit', visit.id, { plate: visit.plate })
  revalidatePath(`/admin/${businessSlug}`, 'layout')
  return { ok: true, value: visit }
}

export async function updateVisitStatusAction(businessSlug: string, businessId: string, visitId: string, status: VisitStatus) {
  const auth = await requireAuth(businessSlug, businessId)
  await data.updateVisitStatus(businessId, visitId, status)
  await data.logAudit(businessId, auth.role, 'visit.status', 'visit', visitId, { status })
  revalidatePath(`/admin/${businessSlug}`, 'layout')
}

export async function updateBrandingAction(businessSlug: string, businessId: string, input: Parameters<typeof data.updateOrganizationBranding>[1]) {
  const auth = await requireAuth(businessSlug, businessId)
  await data.updateOrganizationBranding(businessId, input)
  await data.logAudit(businessId, auth.role, 'org.branding', 'organization', businessId)
  revalidatePath(`/admin/${businessSlug}`, 'layout')
  revalidatePath(`/${businessSlug}`, 'layout')
}

export async function getCampaignSegmentAction(businessSlug: string, businessId: string, segment: string) {
  await requireAuth(businessSlug, businessId)
  return data.getCampaignSegment(businessId, segment)
}