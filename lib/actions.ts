'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'
import * as data from '@/lib/data'
import type { VisitStatus } from '@/lib/data'

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

export async function getCampaignSegmentAction(
  slug: string, 
  organizationId: string, 
  segment: string
) {
  await requireAuth(slug, organizationId)
  return data.getCampaignSegment(organizationId, segment)
}

export async function loginAction(slug: string, email: string, pass: string) {
  try {
    const org = await data.getOrganizationBySlug(slug)
    if (!org) return { ok: false as const, error: 'İşletme bulunamadı.' }

    // 1. Kullanıcıyı email ile bul
    const users = await sql`SELECT * FROM neon_auth.user WHERE email = ${email} LIMIT 1`
    if (!users.length) return { ok: false as const, error: 'Geçersiz e-posta veya şifre.' }
    const user = users[0]

    // 2. Kullanıcının şifresini çek ve kontrol et
    const accounts = await sql`SELECT * FROM neon_auth.account WHERE "userId" = ${user.id} LIMIT 1`
    if (!accounts.length) return { ok: false as const, error: 'Geçersiz e-posta veya şifre.' }
    
    const isMatch = await bcrypt.compare(pass, accounts[0].password)
    if (!isMatch) return { ok: false as const, error: 'Geçersiz e-posta veya şifre.' }

    // 3. Kullanıcı bu işletmenin (organization) yetkilisi mi kontrol et
    const members = await sql`SELECT * FROM neon_auth.member WHERE "userId" = ${user.id} AND "organizationId" = ${org.id} LIMIT 1`
    if (!members.length) return { ok: false as const, error: 'Bu panele erişim yetkiniz yok.' }

    const jar = await cookies()
    jar.set(authCookieName(slug), String(org.id), {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
    })

    revalidatePath(`/admin/${slug}`, 'layout')
    return { ok: true as const, role: members[0].role }
  } catch (error) {
    console.error(error)
    return { ok: false as const, error: 'Sunucu hatası oluştu.' }
  }
}