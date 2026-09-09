'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import * as data from '@/lib/data'
import type { VisitStatus } from '@/lib/data'

// NOT: İleride BetterAuth/Lucia gibi bir sisteme geçtiğinde 
// buradaki cookie okuma mantığı `const session = await auth()` şekline dönüşecek.
// Şu an için MVP izolasyonunu koruyoruz.
function authCookieName(slug: string) {
  return `garaj34_auth_${slug}`
}

export async function getAuthedOrganization(slug: string) {
  try {
    const jar = await cookies()
    const cookieOrgId = jar.get(authCookieName(slug))?.value
    if (!cookieOrgId) return null

    const org = await data.getOrganizationBySlug(slug)
    if (!org || String(org.id) !== String(cookieOrgId)) return null
    
    // Geçici yetkilendirme mock'u
    return { organization: org, role: 'boss' as const } 
  } catch {
    return null
  }
}

// TENTANT ISOLATION KORUMASI: Tüm işlemlerden önce işletme yetkisi kontrol edilir
async function requireAuth(slug: string, organizationId: string) {
  const auth = await getAuthedOrganization(slug)
  if (!auth || String(auth.organization.id) !== String(organizationId)) {
    throw new Error('Yetkisiz islem. Lutfen tekrar giris yapin.')
  }
}

export async function logoutAction(slug: string) {
  const jar = await cookies()
  jar.delete(authCookieName(slug))
  revalidatePath(`/admin/${slug}`, 'layout')
}

export async function addVisitAction(
  slug: string, 
  organizationId: string, 
  input: Parameters<typeof data.addVisit>[1]
) {
  await requireAuth(slug, organizationId)
  const visit = await data.addVisit(organizationId, input)
  revalidatePath(`/admin/${slug}`, 'layout')
  return visit
}

export async function updateVisitStatusAction(
  slug: string, 
  organizationId: string, 
  visitId: string, 
  status: VisitStatus
) {
  await requireAuth(slug, organizationId)
  await data.updateVisitStatus(organizationId, visitId, status)
  revalidatePath(`/admin/${slug}`, 'layout')
}

export async function updateBrandingAction(
  slug: string, 
  organizationId: string, 
  input: Parameters<typeof data.updateOrganizationBranding>[1]
) {
  await requireAuth(slug, organizationId)
  await data.updateOrganizationBranding(organizationId, input)
  revalidatePath(`/admin/${slug}`, 'layout')
  revalidatePath(`/${slug}`, 'layout')
}

// GÜVENLİK AÇIĞI KAPATILDI: Artık bu aksiyon tenant izolasyonundan geçiriliyor
export async function getCampaignSegmentAction(
  slug: string, 
  organizationId: string, 
  segment: string
) {
  await requireAuth(slug, organizationId)
  return data.getCampaignSegment(organizationId, segment)
}

export async function loginAction(slug: string, pin: string) {
  try {
    const org = await data.getOrganizationBySlug(slug)
    // Şimdilik test edebilmek için PIN olarak organizasyon adının ilk 4 harfini veya '1234' kabul ediyoruz (Auth fazına geçene kadar)
    if (!org || (pin !== '1234' && pin !== org.name.substring(0,4))) return { ok: false as const, error: 'Hatalı PIN kodu.' }

    const jar = await cookies()
    jar.set(authCookieName(slug), String(org.id), {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
    })

    revalidatePath(`/admin/${slug}`, 'layout')
    return { ok: true as const, role: 'boss' as const }
  } catch (error) {
    return { ok: false as const, error: 'Sunucu hatası oluştu.' }
  }
}