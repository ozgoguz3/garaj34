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
  const business = await data.verifyBusinessPin(slug, pin)
  if (!business) {
    return { ok: false as const, error: 'Hatalı PIN kodu' }
  }
  const jar = await cookies()
  jar.set(authCookieName(slug), business.id, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 gün
  })
  return { ok: true as const, business }
}

export async function logoutAction(slug: string) {
  const jar = await cookies()
  jar.delete(authCookieName(slug))
}

export async function getAuthedBusiness(slug: string) {
  const jar = await cookies()
  const cookieBusinessId = jar.get(authCookieName(slug))?.value
  if (!cookieBusinessId) return null

  const business = await data.getBusinessBySlug(slug)
  if (!business || business.id !== cookieBusinessId) return null
  return business
}

// ---------- İş (job) mutasyonları ----------

export async function addJobAction(
  businessSlug: string,
  businessId: string,
  input: {
    customerName?: string
    plate: string
    phone?: string
    services: string[]
    price?: number
    warrantyMonths?: number
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
  input: { logoUrl?: string; primaryColor?: string; tagline?: string },
) {
  await data.updateBusinessBranding(businessId, input)
  revalidatePath(`/admin/${businessSlug}`, 'layout')
  revalidatePath(`/${businessSlug}`, 'layout')
}

// ---------- Kampanya ----------

export async function getCampaignSegmentAction(businessId: string, segment: data.CampaignSegment) {
  return data.getCampaignSegment(businessId, segment)
}
