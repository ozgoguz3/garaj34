'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import * as data from '@/lib/data'
import type { VisitStatus } from '@/lib/data'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

function authCookieName(slug: string) {
  return `garaj34_auth_${slug}`
}

export async function loginAction(slug: string, pin: string) {
  try {
    const business = await data.verifyBusinessPin(slug, pin)
    if (!business) return { ok: false as const, error: 'Hatalı PIN kodu.' }

    const jar = await cookies()
    jar.set(authCookieName(slug), String(business.id), {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax', 
      path: '/', 
      maxAge: COOKIE_MAX_AGE,
    })

    revalidatePath(`/admin/${slug}`, 'layout')
    return { ok: true as const, business, role: 'boss' as const }
  } catch {
    return { ok: false as const, error: 'Sunucu hatası oluştu.' }
  }
}

export async function logoutAction(slug: string) {
  const jar = await cookies()
  jar.delete(authCookieName(slug))
  revalidatePath(`/admin/${slug}`, 'layout')
}

// İsim uyuşmazlığını gidermek için her iki ismi de export ediyoruz
export async function getAuthedOrganization(slug: string) {
  try {
    const jar = await cookies()
    const cookieBusinessId = jar.get(authCookieName(slug))?.value
    if (!cookieBusinessId) return null

    const business = await data.getBusinessBySlug(slug)
    if (!business || String(business.id) !== String(cookieBusinessId)) return null
    
    return { organization: business, role: 'boss' as const }
  } catch {
    return null
  }
}

export async function getAuthedBusiness(slug: string) {
  return getAuthedOrganization(slug)
}

async function requireAuth(slug: string, businessId: string) {
  const auth = await getAuthedOrganization(slug)
  if (!auth || String(auth.organization.id) !== String(businessId)) {
    throw new Error('Yetkisiz islem. Lutfen tekrar giris yapin.')
  }
}

export async function addJobAction(businessSlug: string, businessId: string, input: Parameters<typeof data.addJob>[1]) {
  await requireAuth(businessSlug, businessId)
  const job = await data.addJob(businessId, input)
  revalidatePath(`/admin/${businessSlug}`, 'layout')
  return job
}

export async function setStepAction(businessSlug: string, businessId: string, jobId: string, step: number | VisitStatus) {
  await requireAuth(businessSlug, businessId)
  await data.setJobStep(businessId, jobId, step)
  revalidatePath(`/admin/${businessSlug}`, 'layout')
}

export async function archiveJobAction(businessSlug: string, businessId: string, jobId: string) {
  await requireAuth(businessSlug, businessId)
  await data.archiveJob(businessId, jobId)
  revalidatePath(`/admin/${businessSlug}`, 'layout')
}

export async function updateBrandingAction(businessSlug: string, businessId: string, input: Parameters<typeof data.updateBusinessBranding>[1]) {
  await requireAuth(businessSlug, businessId)
  await data.updateBusinessBranding(businessId, input)
  revalidatePath(`/admin/${businessSlug}`, 'layout')
  revalidatePath(`/${businessSlug}`, 'layout')
}

export async function uploadJobPhotoAction(businessSlug: string, businessId: string, jobId: string, photoUrl: string, photoType: 'before' | 'after') {
  await requireAuth(businessSlug, businessId)
  await data.addJobPhoto(jobId, photoUrl, photoType)
  revalidatePath(`/admin/${businessSlug}/aktif`, 'page')
}

export async function getCampaignSegmentAction(businessId: string, segment: any) {
  return data.getCampaignSegment(businessId, segment)
}