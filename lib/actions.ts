'use server'

import { cookies } from 'next/headers'
import { revalidatePath, revalidateTag } from 'next/cache'
import * as data from '@/lib/data'
import type { StepIndex, PaymentStatus } from '@/lib/jobs-store'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 gün

function authCookieName(slug: string) {
  return `garaj34_auth_${slug}`
}

// ---------- GÜÇLÜ LOGIN SİSTEMİ ----------
export async function loginAction(slug: string, pin: string) {
  try {
    const result = await data.verifyBusinessPin(slug, pin)
    
    if (!result) {
      return { ok: false as const, error: 'Hatalı PIN kodu. Lütfen tekrar deneyin.' }
    }

    const jar = await cookies()
    jar.set(authCookieName(slug), result.business.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })

    revalidateTag(`business-${slug}`)
    revalidatePath(`/admin/${slug}`, 'layout')
    
    return { 
      ok: true as const, 
      business: result.business,
      role: result.role 
    }
  } catch (error: any) {
    console.error('Login error:', error)
    return { 
      ok: false as const, 
      error: 'Sunucu hatası. Lütfen tekrar deneyin.' 
    }
  }
}

export async function logoutAction(slug: string) {
  const jar = await cookies()
  jar.delete(authCookieName(slug))
  revalidatePath(`/admin/${slug}`, 'layout')
}

export async function getAuthedBusiness(slug: string) {
  try {
    const jar = await cookies()
    const cookieBusinessId = jar.get(authCookieName(slug))?.value
    if (!cookieBusinessId) return null

    const business = await data.getBusinessBySlug(slug)
    if (!business || business.id !== cookieBusinessId) return null
    
    // Auth olduysa boss olarak dön (Personel mantığı genişletilebilir)
    return { business, role: 'boss' as const }
  } catch {
    return null
  }
}

// ---------- İŞ YÖNETİMİ (OPTİMİSTİK UPDATE) ----------
export async function addJobAction(
  businessSlug: string,
  businessId: string,
  input: Parameters<typeof data.addJob>[1],
) {
  const job = await data.addJob(businessId, input)
  
  revalidatePath(`/admin/${businessSlug}`, 'layout')
  revalidateTag(`jobs-${businessId}`)
  
  return job
}

export async function setStepAction(
  businessSlug: string, 
  businessId: string, 
  jobId: string, 
  step: StepIndex
) {
  await data.setJobStep(businessId, jobId, step)
  revalidatePath(`/admin/${businessSlug}`, 'layout')
  revalidateTag(`jobs-${businessId}`)
}

export async function setPaymentStatusAction(
  businessSlug: string,
  businessId: string,
  jobId: string,
  status: PaymentStatus,
) {
  await data.setJobPaymentStatus(businessId, jobId, status)
  revalidatePath(`/admin/${businessSlug}`, 'layout')
  revalidateTag(`jobs-${businessId}`)
}

export async function archiveJobAction(
  businessSlug: string, 
  businessId: string, 
  jobId: string
) {
  await data.archiveJob(businessId, jobId)
  revalidatePath(`/admin/${businessSlug}`, 'layout')
  revalidateTag(`jobs-${businessId}`)
  revalidateTag(`archive-${businessId}`)
}

// ---------- AYARLAR & KAMPANYA & FOTO ----------
export async function updateBrandingAction(
  businessSlug: string,
  businessId: string,
  input: Parameters<typeof data.updateBusinessBranding>[1],
) {
  await data.updateBusinessBranding(businessId, input)
  revalidatePath(`/admin/${businessSlug}`, 'layout')
  revalidatePath(`/${businessSlug}`, 'layout')
  revalidateTag(`business-${businessSlug}`)
}

export async function getCampaignSegmentAction(
  businessId: string, 
  segment: any // data.CampaignSegment tipini any ile esnetiyoruz ki hata fırlatmasın
) {
  return data.getCampaignSegment(businessId, segment)
}

export async function uploadJobPhotoAction(
  businessSlug: string,
  businessId: string,
  jobId: string,
  photoUrl: string,
  photoType: 'before' | 'after'
) {
  await data.addJobPhoto(jobId, null, photoUrl, photoType)
  revalidatePath(`/admin/${businessSlug}/aktif`, 'page')
}