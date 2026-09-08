'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import * as data from '@/lib/data'
import type { StepIndex, PaymentStatus } from '@/lib/jobs-store'

function authCookieName(slug: string) {
  return `garaj34_auth_${slug}`
}

// ---------- Admin girişi ----------

export async function loginAction(slug: string, pin: string) {
  // data.verifyBusinessPin artık { business, role } dönüyor
  const authResult = await data.verifyBusinessPin(slug, pin)
  if (!authResult) {
    return { ok: false as const, error: 'Hatalı PIN kodu' }
  }
  
  const jar = await cookies()
  
  // Cookie'ye hem işletme ID'sini hem de giriş yapanın rolünü kaydediyoruz
  const cookieValue = JSON.stringify({ 
    id: authResult.business.id, 
    role: authResult.role 
  })
  
  jar.set(authCookieName(slug), cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 gün
  })
  
  return { ok: true as const, business: authResult.business, role: authResult.role }
}

export async function logoutAction(slug: string) {
  const jar = await cookies()
  jar.delete(authCookieName(slug))
}

export async function getAuthedBusiness(slug: string) {
  const jar = await cookies()
  const cookieString = jar.get(authCookieName(slug))?.value
  if (!cookieString) return null

  try {
    const parsed = JSON.parse(cookieString)
    const business = await data.getBusinessBySlug(slug)
    
    if (!business || business.id !== parsed.id) return null
    
    // Güvenlik: Sayfalara işletme verisiyle birlikte rolü de (boss/employee) yolluyoruz
    return { business, role: parsed.role as 'boss' | 'employee' }
  } catch (e) {
    // Tarayıcıda eski bozuk çerez kaldıysa sıfırlar ve tekrar giriş ister
    return null
  }
}

// ---------- İş (job) mutasyonları ----------

export async function addJobAction(
  businessSlug: string,
  businessId: string,
  input: {
    customerName?: string
    plate: string
    carModel?: string // YENİ: Araç Modeli
    phone?: string
    services: string[]
    price?: number
    warrantyMonths?: number
    damageNote?: string // YENİ: Hasar Notu
  },
) {
  const job = await data.addJob(businessId, input)
  revalidatePath(`/admin/${businessSlug}`, 'layout')
  return job
}

export async function setStepAction(businessSlug: string, businessId: string, jobId: string, step: StepIndex) {
  await data.setJobStep(businessId, jobId, step)
  revalidatePath(`/admin/${businessSlug}`, 'layout')
}

export async function setPaymentStatusAction(
  businessSlug: string,
  businessId: string,
  jobId: string,
  status: PaymentStatus,
) {
  await data.setJobPaymentStatus(businessId, jobId, status)
  revalidatePath(`/admin/${businessSlug}`, 'layout')
}

export async function archiveJobAction(businessSlug: string, businessId: string, jobId: string) {
  await data.archiveJob(businessId, jobId)
  revalidatePath(`/admin/${businessSlug}`, 'layout')
}

// ---------- Ayarlar / Marka ----------

export async function updateBrandingAction(
  businessSlug: string,
  businessId: string,
  input: { logoUrl?: string; primaryColor?: string; tagline?: string; googleMapsUrl?: string },
) {
  await data.updateBusinessBranding(businessId, input)
  revalidatePath(`/admin/${businessSlug}`, 'layout')
  revalidatePath(`/${businessSlug}`, 'layout')
}

// ---------- Kampanya ----------

export async function getCampaignSegmentAction(businessId: string, segment: data.CampaignSegment) {
  return data.getCampaignSegment(businessId, segment)
}