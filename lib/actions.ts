// lib/actions.ts
'use server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import * as data from '@/lib/data'
import type { VisitStatus, CampaignTarget } from '@/lib/data'
import { billingState } from '@/lib/billing'
import { validateVisit, type VisitInput } from '@/lib/validate'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30
const authCookieName = (slug: string) => `garaj34_auth_${slug}`

export type Result<T> = { ok: true; value: T } | { ok: false; error: string }
export type Void = { ok: true } | { ok: false; error: string }
const fail = (e: unknown) => (e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.')

export async function loginAction(slug: string, pin: string): Promise<Void> {
  try {
    const res = await data.verifyPin(slug, pin)
    if (!res) return { ok: false, error: 'Hatalı PIN kodu.' }
    const jar = await cookies()
    jar.set(authCookieName(slug), `${res.organization.id}.${res.role}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: COOKIE_MAX_AGE })
    revalidatePath(`/admin/${slug}`, 'layout')
    return { ok: true }
  } catch (e) { return { ok: false, error: fail(e) } }
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

async function requireAuth(slug: string, businessId: string) {
  const auth = await getAuthedOrganization(slug)
  if (!auth || String(auth.organization.id) !== String(businessId)) throw new Error('Oturum doğrulanamadı.')
  return auth
}

export async function addVisitAction(businessSlug: string, businessId: string, input: VisitInput): Promise<Result<data.Visit>> {
  try {
    const auth = await requireAuth(businessSlug, businessId)
    const v = validateVisit(input)
    if (!v.ok) return { ok: false, error: v.error }
    const visit = await data.addVisit(businessId, v.value)
    revalidatePath(`/admin/${businessSlug}`)
    return { ok: true, value: visit }
  } catch (e) { return { ok: false, error: fail(e) } }
}

export async function updateVisitStatusAction(businessSlug: string, businessId: string, visitId: string, status: VisitStatus): Promise<Void> {
  try {
    await requireAuth(businessSlug, businessId)
    await data.updateVisitStatus(businessId, visitId, status)
    revalidatePath(`/admin/${businessSlug}`)
    return { ok: true }
  } catch (e) { return { ok: false, error: fail(e) } }
}

export async function updateBrandingAction(businessSlug: string, businessId: string, input: any): Promise<Void> {
  try {
    await requireAuth(businessSlug, businessId)
    await data.updateOrganizationBranding(businessId, input)
    revalidatePath(`/admin/${businessSlug}`)
    return { ok: true }
  } catch (e) { return { ok: false, error: fail(e) } }
}

export async function getCampaignSegmentAction(businessSlug: string, businessId: string, segment: string): Promise<Result<CampaignTarget[]>> {
  try {
    await requireAuth(businessSlug, businessId)
    return { ok: true, value: await data.getCampaignSegment(businessId, segment) }
  } catch (e) { return { ok: false, error: fail(e) } }
}