// lib/data.ts
import 'server-only'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'
import { normalizePlate } from '@/lib/jobs-store'
import { visitWeight } from '@/lib/catalog'

export type Organization = { id: string; slug: string; name: string; logoUrl: string | null; tagline: string; primaryColor: string; googleMapsUrl: string | null; whatsappPhone: string | null; planId: string; subscriptionStatus: string; trialEndsAt: string | null; subscriptionRenewsAt: string | null; metadata: any; createdAt: string }
export type VisitStatus = 'queued' | 'processing' | 'ready' | 'completed' | 'cancelled'
export type Visit = { id: string; vehicleId: string; organizationId: string; status: VisitStatus; services: string[]; damageNote: string | null; internalNote: string | null; warrantyEndDate: string | null; createdAt: string; completedAt: string | null; plate?: string; customerName?: string; phone?: string | null; carModel?: string | null }
export type CampaignTarget = { plate: string; customerName: string; phone: string; lastVisit: string; services: string[]; warrantyEnd?: string | null; weight?: number }
export type RetentionInsight = { plate: string; customerName: string; phone: string; visitCount: number; lastVisit: string; isOverdue: boolean }

function mapOrg(r: any): Organization {
  return { id: String(r.id), slug: String(r.slug), name: String(r.name), logoUrl: r.logo_url || null, tagline: String(r.tagline || ''), primaryColor: String(r.primary_color || '#10b981'), googleMapsUrl: r.google_maps_url || null, whatsappPhone: r.whatsapp_phone || null, planId: String(r.plan_id || 'trial'), subscriptionStatus: String(r.subscription_status || 'trial'), trialEndsAt: r.trial_ends_at || null, subscriptionRenewsAt: r.subscription_renews_at || null, metadata: r.metadata || {}, createdAt: String(r.created_at) }
}

function mapVisit(r: any): Visit {
  return { id: String(r.id), vehicleId: String(r.vehicle_id), organizationId: String(r.organization_id), status: r.status as VisitStatus, services: r.services || [], damageNote: r.damage_note, internalNote: r.internal_note, warrantyEndDate: r.warranty_end_date, createdAt: r.created_at, completedAt: r.completed_at, plate: r.plate, customerName: r.customername, phone: r.phone, carModel: r.carmodel }
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const rows = await sql`SELECT * FROM organizations WHERE slug = ${slug} LIMIT 1`
  return rows.length ? mapOrg(rows[0]) : null
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  const rows = await sql`SELECT * FROM organizations WHERE id = ${id} LIMIT 1`
  return rows.length ? mapOrg(rows[0]) : null
}

export async function verifyPin(slug: string, pin: string): Promise<{ organization: Organization; role: 'boss' | 'employee' } | null> {
  const rows = await sql`SELECT * FROM organizations WHERE slug = ${slug} LIMIT 1`
  if (!rows.length) return null
  if (await bcrypt.compare(pin, rows[0].pin_hash)) return { organization: mapOrg(rows[0]), role: 'boss' }
  if (rows[0].employee_pin_hash && await bcrypt.compare(pin, rows[0].employee_pin_hash)) return { organization: mapOrg(rows[0]), role: 'employee' }
  return null
}

export async function updateOrganizationBranding(orgId: string, input: { logoUrl?: string; tagline?: string; primaryColor?: string; googleMapsUrl?: string }) {
  await sql`UPDATE organizations SET logo_url = COALESCE(${input.logoUrl ?? null}, logo_url), tagline = COALESCE(${input.tagline ?? null}, tagline), primary_color = COALESCE(${input.primaryColor ?? null}, primary_color), google_maps_url = COALESCE(${input.googleMapsUrl ?? null}, google_maps_url) WHERE id = ${orgId}`
}

export async function addVisit(orgId: string, input: any): Promise<Visit> {
  const customerName = input.customerName?.trim() || 'İsimsiz Müşteri'
  const phone = input.phone?.trim() || null
  const plate = normalizePlate(input.plate)
  const carModel = input.carModel?.trim() || null
  
  let customerId: string
  if (phone) {
    const c = await sql`INSERT INTO customers (organization_id, full_name, phone) VALUES (${orgId}, ${customerName}, ${phone}) ON CONFLICT (organization_id, phone) DO UPDATE SET full_name = EXCLUDED.full_name RETURNING id`
    customerId = String(c[0].id)
  } else {
    const c = await sql`INSERT INTO customers (organization_id, full_name) VALUES (${orgId}, ${customerName}) RETURNING id`
    customerId = String(c[0].id)
  }
  
  const v = await sql`INSERT INTO vehicles (organization_id, customer_id, plate, model) VALUES (${orgId}, ${customerId}, ${plate}, ${carModel}) ON CONFLICT (organization_id, plate) DO UPDATE SET customer_id = EXCLUDED.customer_id, model = COALESCE(EXCLUDED.model, vehicles.model) RETURNING id`
  const vehicleId = String(v[0].id)
  
  const ins = await sql`INSERT INTO visits (organization_id, vehicle_id, status, services, damage_note, internal_note) VALUES (${orgId}, ${vehicleId}, 'queued', ${input.services}, ${input.damageNote || null}, ${input.internalNote || null}) RETURNING *`
  return { ...mapVisit(ins[0]), plate, customerName, phone, carModel }
}

export async function listActiveVisits(orgId: string): Promise<Visit[]> {
  const rows = await sql`SELECT v.*, veh.plate, veh.model as carModel, c.full_name as customerName, c.phone FROM visits v JOIN vehicles veh ON v.vehicle_id = veh.id LEFT JOIN customers c ON veh.customer_id = c.id WHERE v.organization_id = ${orgId} AND v.status IN ('queued','processing','ready') ORDER BY v.created_at DESC`
  return rows.map(mapVisit)
}

export async function listCompletedVisits(orgId: string): Promise<Visit[]> {
  const rows = await sql`SELECT v.*, veh.plate, veh.model as carModel, c.full_name as customerName, c.phone FROM visits v JOIN vehicles veh ON v.vehicle_id = veh.id LEFT JOIN customers c ON veh.customer_id = c.id WHERE v.organization_id = ${orgId} AND v.status IN ('completed','cancelled') ORDER BY v.completed_at DESC NULLS LAST, v.created_at DESC`
  return rows.map(mapVisit)
}

export async function findVisitByPlate(orgId: string, slug: string): Promise<Visit | null> {
  const normalized = slug.toUpperCase()
  const rows = await sql`SELECT v.*, veh.plate, veh.model as carModel, c.full_name as customerName, c.phone FROM visits v JOIN vehicles veh ON v.vehicle_id = veh.id LEFT JOIN customers c ON veh.customer_id = c.id WHERE v.organization_id = ${orgId} AND REPLACE(veh.plate,' ','') = ${normalized} AND v.status != 'cancelled' ORDER BY v.created_at DESC LIMIT 1`
  return rows.length ? mapVisit(rows[0]) : null
}

export async function updateVisitStatus(orgId: string, visitId: string, status: VisitStatus) {
  await sql`UPDATE visits SET status = ${status}, completed_at = CASE WHEN ${status} = 'completed' THEN COALESCE(completed_at, now()) ELSE NULL END WHERE id = ${visitId} AND organization_id = ${orgId}`
}

export async function getCampaignSegment(orgId: string, segment: string): Promise<CampaignTarget[]> {
  const rows = await sql`SELECT veh.plate, c.full_name AS customer_name, c.phone, v.created_at, v.warranty_end_date, v.services FROM visits v JOIN vehicles veh ON v.vehicle_id = veh.id JOIN customers c ON veh.customer_id = c.id WHERE v.organization_id = ${orgId} AND c.phone IS NOT NULL`
  // JS grouping logic for safety
  const groups = new Map<string, any>()
  for (const r of rows as any[]) {
    const key = `${r.plate}|${r.phone}`
    let g = groups.get(key)
    if (!g) { g = { plate: String(r.plate), customerName: String(r.customer_name), phone: String(r.phone), lastVisit: String(r.created_at), services: new Set<string>(), totalWeight: 0 }; groups.set(key, g) }
    for (const s of (Array.isArray(r.services) ? r.services : [])) g.services.add(String(s))
    g.totalWeight += visitWeight(Array.isArray(r.services) ? r.services : [])
  }
  return Array.from(groups.values()).map(g => ({ plate: g.plate, customerName: g.customerName, phone: g.phone, lastVisit: g.lastVisit, services: [...g.services], weight: g.totalWeight }))
}

export async function getRetentionInsights(orgId: string): Promise<RetentionInsight[]> { return [] }
export async function getServicePopularity(orgId: string) { return [] }
export async function getBusiestWeekday(orgId: string) { return [] }
export async function getNewVsReturningRatio(orgId: string) { return { total: 0, returning: 0, new: 0 } }
export async function getMonthlyVisitTrend(orgId: string) { return [] }
export async function getBehaviorStats(orgId: string) { return { monthWeight: [], top: [], tierMix: [], protectionShare: 0, avgWeight: 0, totalWeight: 0, totalVisits: 0 } }