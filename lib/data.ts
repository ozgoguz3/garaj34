import 'server-only'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'
import { normalizePlate } from '@/lib/jobs-store'
import { visitWeight, PROTECTION_SERVICES, PAINT_SERVICES, SERVICE_CATALOG, TIER_LABELS, type ServiceTier } from '@/lib/catalog'

// --- TİPLER ---
export type Organization = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  tagline: string
  primaryColor: string
  googleMapsUrl: string | null
  whatsappPhone: string | null
  planId: string
  subscriptionStatus: string
  trialEndsAt: string | null
  subscriptionRenewsAt: string | null
  metadata: any
  createdAt: string
}
export type VisitStatus = 'queued' | 'processing' | 'ready' | 'completed' | 'cancelled'
export type Visit = {
  id: string
  vehicleId: string
  organizationId: string
  status: VisitStatus
  services: string[]
  damageNote: string | null
  internalNote: string | null
  warrantyEndDate: string | null
  createdAt: string
  completedAt: string | null
  plate?: string
  customerName?: string
  phone?: string | null
  carModel?: string | null
}
export type CampaignTarget = {
  plate: string
  customerName: string
  phone: string
  lastVisit: string
  services: string[]
  warrantyEnd?: string | null
  weight?: number
}
export type RetentionInsight = {
  plate: string
  customerName: string
  phone: string
  visitCount: number
  lastVisit: string
  isOverdue: boolean
}

function mapOrg(r: any): Organization {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    logoUrl: r.logo_url || null,
    tagline: String(r.tagline || ''),
    primaryColor: String(r.primary_color || '#10b981'),
    googleMapsUrl: r.google_maps_url || null,
    whatsappPhone: r.whatsapp_phone || null,
    planId: String(r.plan_id || 'trial'),
    subscriptionStatus: String(r.subscription_status || 'trial'),
    trialEndsAt: r.trial_ends_at || null,
    subscriptionRenewsAt: r.subscription_renews_at || null,
    metadata: r.metadata || {},
    createdAt: String(r.created_at),
  }
}
function mapVisit(r: any): Visit {
  return {
    id: String(r.id),
    vehicleId: String(r.vehicle_id),
    organizationId: String(r.organization_id),
    status: r.status as VisitStatus,
    services: r.services || [],
    damageNote: r.damage_note,
    internalNote: r.internal_note,
    warrantyEndDate: r.warranty_end_date,
    createdAt: r.created_at,
    completedAt: r.completed_at,
    plate: r.plate,
    customerName: r.customername,
    phone: r.phone,
    carModel: r.carmodel,
  }
}

// --- ORGANIZASYON ---
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
  if (rows[0].employee_pin_hash && await bcrypt.compare(pin, rows[0].employee_pin_hash))
    return { organization: mapOrg(rows[0]), role: 'employee' }
  return null
}
export async function updateOrganizationBranding(orgId: string, input: { logoUrl?: string; tagline?: string; primaryColor?: string; googleMapsUrl?: string }) {
  await sql`
    UPDATE organizations SET
      logo_url = COALESCE(${input.logoUrl ?? null}, logo_url),
      tagline = COALESCE(${input.tagline ?? null}, tagline),
      primary_color = COALESCE(${input.primaryColor ?? null}, primary_color),
      google_maps_url = COALESCE(${input.googleMapsUrl ?? null}, google_maps_url)
    WHERE id = ${orgId}
  `
}
export async function setSubscription(orgId: string, input: { planId: string; status: string; renewsAt: string | null }) {
  await sql`
    UPDATE organizations SET plan_id = ${input.planId}, subscription_status = ${input.status},
      subscription_renews_at = ${input.renewsAt} WHERE id = ${orgId}
  `
}
export async function logAudit(orgId: string, actor: string, action: string, entity: string, entityId: string | null, meta: Record<string, unknown> = {}) {
  const metaJson = JSON.stringify(meta)
  await sql`
    INSERT INTO audit_logs (organization_id, actor, action, entity, entity_id, meta)
    VALUES (${orgId}, ${actor}, ${action}, ${entity}, ${entityId}, ${metaJson}::jsonb)
  `
}

// --- OPERASYON ---
export async function countActiveVisits(orgId: string): Promise<number> {
  const rows = await sql`SELECT count(*)::int AS n FROM visits WHERE organization_id = ${orgId} AND status IN ('queued','processing','ready')`
  return Number(rows[0]?.n ?? 0)
}
export async function addVisit(orgId: string, input: {
  customerName?: string; plate: string; carModel?: string; phone?: string
  services: string[]; warrantyMonths?: number; damageNote?: string; internalNote?: string
}): Promise<Visit> {
  const customerName = input.customerName?.trim() || 'İsimsiz Müşteri'
  const phone = input.phone?.trim() || null
  const plate = normalizePlate(input.plate)
  const carModel = input.carModel?.trim() || null
  let warrantyEndDate: string | null = null
  if (input.warrantyMonths) {
    const d = new Date()
    d.setMonth(d.getMonth() + input.warrantyMonths)
    warrantyEndDate = d.toISOString()
  }
  let customerId: string
  if (phone) {
    const c = await sql`
      INSERT INTO customers (organization_id, full_name, phone)
      VALUES (${orgId}, ${customerName}, ${phone})
      ON CONFLICT (organization_id, phone) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id`
    customerId = String(c[0].id)
  } else {
    const c = await sql`INSERT INTO customers (organization_id, full_name) VALUES (${orgId}, ${customerName}) RETURNING id`
    customerId = String(c[0].id)
  }
  const v = await sql`
    INSERT INTO vehicles (organization_id, customer_id, plate, model)
    VALUES (${orgId}, ${customerId}, ${plate}, ${carModel})
    ON CONFLICT (organization_id, plate) DO UPDATE SET customer_id = EXCLUDED.customer_id, model = COALESCE(EXCLUDED.model, vehicles.model)
    RETURNING id`
  const vehicleId = String(v[0].id)
  const ins = await sql`
    INSERT INTO visits (organization_id, vehicle_id, status, services, damage_note, internal_note, warranty_end_date)
    VALUES (${orgId}, ${vehicleId}, 'queued', ${input.services}, ${input.damageNote || null}, ${input.internalNote || null}, ${warrantyEndDate})
    RETURNING *`
  return { ...mapVisit(ins[0]), plate, customerName, phone, carModel }
}
export async function listActiveVisits(orgId: string): Promise<Visit[]> {
  const rows = await sql`
    SELECT v.*, veh.plate, veh.model as carModel, c.full_name as customerName, c.phone
    FROM visits v
    JOIN vehicles veh ON v.vehicle_id = veh.id
    LEFT JOIN customers c ON veh.customer_id = c.id
    WHERE v.organization_id = ${orgId} AND v.status IN ('queued','processing','ready')
    ORDER BY v.created_at DESC`
  return rows.map(mapVisit)
}
export async function listCompletedVisits(orgId: string): Promise<Visit[]> {
  const rows = await sql`
    SELECT v.*, veh.plate, veh.model as carModel, c.full_name as customerName, c.phone
    FROM visits v
    JOIN vehicles veh ON v.vehicle_id = veh.id
    LEFT JOIN customers c ON veh.customer_id = c.id
    WHERE v.organization_id = ${orgId} AND v.status IN ('completed','cancelled')
    ORDER BY v.completed_at DESC NULLS LAST, v.created_at DESC`
  return rows.map(mapVisit)
}
export async function findVisitByPlate(orgId: string, slug: string): Promise<Visit | null> {
  const normalized = slug.toUpperCase()
  const rows = await sql`
    SELECT v.*, veh.plate, veh.model as carModel, c.full_name as customerName, c.phone
    FROM visits v
    JOIN vehicles veh ON v.vehicle_id = veh.id
    LEFT JOIN customers c ON veh.customer_id = c.id
    WHERE v.organization_id = ${orgId}
      AND REPLACE(veh.plate,' ','') = ${normalized}
      AND v.status != 'cancelled'
    ORDER BY v.created_at DESC LIMIT 1`
  return rows.length ? mapVisit(rows[0]) : null
}
export async function updateVisitStatus(orgId: string, visitId: string, status: VisitStatus) {
  await sql`
    UPDATE visits SET status = ${status},
      completed_at = CASE WHEN ${status} = 'completed' THEN COALESCE(completed_at, now()) ELSE NULL END
    WHERE id = ${visitId} AND organization_id = ${orgId}
  `
}

// --- KAMPANYA & DAVRANIŞ ---
export async function getCampaignSegment(orgId: string, segment: string): Promise<CampaignTarget[]> {
  const rows = await sql`
    SELECT veh.plate, c.full_name AS customer_name, c.phone,
           v.created_at, v.warranty_end_date, v.services
    FROM visits v
    JOIN vehicles veh ON v.vehicle_id = veh.id
    JOIN customers c ON veh.customer_id = c.id
    WHERE v.organization_id = ${orgId} AND c.phone IS NOT NULL
  `
  const groups = new Map<string, {
    plate: string; customerName: string; phone: string; lastVisit: string
    services: Set<string>; warrantyEnd: string | null; totalVisits: number; totalWeight: number
  }>()
  for (const r of rows as any[]) {
    const rowServices: string[] = Array.isArray(r.services) ? r.services : []
    const key = `${r.plate}|${r.phone}`
    let g = groups.get(key)
    if (!g) {
      g = {
        plate: String(r.plate || ''), customerName: String(r.customer_name || ''), phone: String(r.phone || ''),
        lastVisit: String(r.created_at || ''), services: new Set<string>(), warrantyEnd: null, totalVisits: 0, totalWeight: 0,
      }
      groups.set(key, g)
    }
    if (r.created_at && new Date(r.created_at).getTime() > new Date(g.lastVisit || 0).getTime()) g.lastVisit = String(r.created_at)
    for (const s of rowServices) g.services.add(String(s))
    if (r.warranty_end_date && (!g.warrantyEnd || new Date(r.warranty_end_date).getTime() > new Date(g.warrantyEnd).getTime())) g.warrantyEnd = String(r.warranty_end_date)
    g.totalVisits += 1
    g.totalWeight += visitWeight(rowServices)
  }
  const now = Date.now()
  const mapped = [...groups.values()].map((g) => ({
    plate: g.plate, customerName: g.customerName, phone: g.phone, lastVisit: g.lastVisit,
    services: [...g.services], warrantyEnd: g.warrantyEnd, weight: g.totalWeight,
    daysSince: Math.floor((now - new Date(g.lastVisit).getTime()) / (1000 * 60 * 60 * 24)),
    totalVisits: g.totalVisits, totalWeight: g.totalWeight,
  }))
  let filtered = mapped
  if (segment === 'inactive_30') filtered = mapped.filter((c) => c.daysSince >= 30 && c.daysSince < 60)
  else if (segment === 'inactive_60') filtered = mapped.filter((c) => c.daysSince >= 60)
  else if (segment === 'ceramic_ppf_only') filtered = mapped.filter((c) => c.services.some((s) => s.includes('Seramik') || s.includes('Film') || s.includes('PPF')))
  else if (segment === 'warranty_soon')
    filtered = mapped.filter((c) => c.warrantyEnd && new Date(c.warrantyEnd).getTime() > now && new Date(c.warrantyEnd).getTime() < now + 90 * 86400000)
  else if (segment === 'winback_high') filtered = mapped.filter((c) => c.totalWeight >= 25 && c.daysSince >= 45)
  else if (segment === 'protection_upsell')
    filtered = mapped.filter((c) => c.services.some((s) => PAINT_SERVICES.includes(s)) && !c.services.some((s) => PROTECTION_SERVICES.includes(s)))
  else if (segment === 'high_value') filtered = [...mapped].sort((a, b) => b.totalWeight - a.totalWeight).slice(0, 20)
  return filtered.map((f) => ({ plate: f.plate, customerName: f.customerName, phone: f.phone, lastVisit: f.lastVisit, services: f.services, warrantyEnd: f.warrantyEnd, weight: f.weight }))
}

export async function getRetentionInsights(orgId: string): Promise<RetentionInsight[]> {
  const rows = await sql`
    SELECT veh.plate, c.full_name as customer_name, c.phone,
           array_agg(v.created_at ORDER BY v.created_at DESC) AS visit_dates
    FROM visits v
    JOIN vehicles veh ON v.vehicle_id = veh.id
    JOIN customers c ON veh.customer_id = c.id
    WHERE v.organization_id = ${orgId} AND v.status = 'completed'
    GROUP BY veh.plate, c.full_name, c.phone
    HAVING count(v.id) >= 2
  `
  const now = Date.now()
  const mapped: RetentionInsight[] = rows.map((r: any) => {
    const dates = (Array.isArray(r.visit_dates) ? r.visit_dates : []).map((v: string) => new Date(v).getTime())
    const gaps = dates.slice(0, -1).map((d: number, i: number) => d - dates[i + 1])
    const avgGap = gaps.length > 0 ? gaps.reduce((a: number, b: number) => a + b, 0) / gaps.length : 0
    const sinceLast = now - (dates[0] || now)
    return {
      plate: String(r.plate || ''),
      customerName: String(r.customer_name || ''),
      phone: String(r.phone || ''),
      visitCount: dates.length,
      lastVisit: new Date(dates[0] || now).toISOString(),
      isOverdue: sinceLast > avgGap * 1.5,
    }
  })
  return mapped.filter((c) => c.isOverdue).sort((a, b) => new Date(a.lastVisit).getTime() - new Date(b.lastVisit).getTime())
}

export async function getServicePopularity(orgId: string) {
  const rows = await sql`
    SELECT unnest(services) AS service, COUNT(*) AS count
    FROM visits WHERE organization_id = ${orgId} AND status = 'completed'
    GROUP BY service ORDER BY count DESC LIMIT 8`
  return rows.map((r: any) => ({ service: String(r.service), count: Number(r.count) }))
}
export async function getBusiestWeekday(orgId: string) {
  const rows = await sql`
    SELECT extract(dow FROM created_at) AS weekday, COUNT(*) AS count
    FROM visits WHERE organization_id = ${orgId} AND status = 'completed'
    GROUP BY weekday ORDER BY count DESC`
  return rows.map((r: any) => ({ weekday: Number(r.weekday), count: Number(r.count) }))
}
export async function getNewVsReturningRatio(orgId: string) {
  const rows = await sql`
    SELECT vehicle_id, COUNT(*) AS visits FROM visits
    WHERE organization_id = ${orgId} AND status = 'completed' GROUP BY vehicle_id`
  const total = rows.length
  const returning = rows.filter((r: any) => Number(r.visits) > 1).length
  return { total, returning, new: total - returning }
}
export async function getMonthlyVisitTrend(orgId: string) {
  const rows = await sql`
    SELECT date_trunc('month', created_at) AS month, COUNT(*) AS visits
    FROM visits WHERE organization_id = ${orgId} AND status = 'completed' AND created_at > now() - interval '6 months'
    GROUP BY month ORDER BY month ASC`
  return rows.map((r: any) => ({ month: String(r.month), visits: Number(r.visits) }))
}
export async function getWarrantyExpirations(orgId: string, days = 90) {
  const daysText = String(days)
  const rows = await sql`
    SELECT v.*, veh.plate, veh.model as carModel, c.full_name as customerName, c.phone
    FROM visits v
    JOIN vehicles veh ON v.vehicle_id = veh.id
    LEFT JOIN customers c ON veh.customer_id = c.id
    WHERE v.organization_id = ${orgId}
      AND v.warranty_end_date BETWEEN now() AND now() + (${daysText} || ' days')::interval
    ORDER BY v.warranty_end_date ASC LIMIT 50`
  return rows.map(mapVisit)
}

// --- İŞ ZEKASI: HİZMET AĞIRLIĞI (para yok, sinyal var) ---
export async function getBehaviorStats(orgId: string) {
  const rows = await sql`
    SELECT v.services, v.created_at, veh.plate, c.full_name AS name
    FROM visits v
    JOIN vehicles veh ON v.vehicle_id = veh.id
    LEFT JOIN customers c ON veh.customer_id = c.id
    WHERE v.organization_id = ${orgId} AND v.status = 'completed'`
  const monthMap = new Map<string, { weight: number; visits: number }>()
  const custMap = new Map<string, { name: string; plate: string; visits: number; weight: number; last: number }>()
  const tierMix = new Map<string, number>()
  let protection = 0, total = 0, weightTotal = 0
  for (const r of rows as any[]) {
    const services: string[] = Array.isArray(r.services) ? r.services : []
    const w = visitWeight(services)
    const d = new Date(r.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const m = monthMap.get(key) || { weight: 0, visits: 0 }
    m.weight += w; m.visits += 1; monthMap.set(key, m)
    const ck = `${r.plate}|${r.name}`
    const c = custMap.get(ck) || { name: String(r.name || ''), plate: String(r.plate || ''), visits: 0, weight: 0, last: 0 }
    c.visits += 1; c.weight += w; c.last = Math.max(c.last, d.getTime()); custMap.set(ck, c)
    const tiers = new Set(services.map((s) => SERVICE_CATALOG.find((x) => x.name === s)?.tier).filter(Boolean))
    tiers.forEach((t) => {
      const label = TIER_LABELS[t as ServiceTier]
      tierMix.set(label, (tierMix.get(label) || 0) + 1)
    })
    if (services.some((s) => PROTECTION_SERVICES.includes(s))) protection += 1
    total += 1; weightTotal += w
  }
  return {
    monthWeight: [...monthMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-6).map(([month, v]) => ({ month, weight: v.weight, visits: v.visits })),
    top: [...custMap.values()].sort((a, b) => b.weight - a.weight).slice(0, 10),
    tierMix: [...tierMix.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    protectionShare: total ? Math.round((protection / total) * 100) : 0,
    avgWeight: total ? Math.round((weightTotal / total) * 10) / 10 : 0,
    totalWeight: weightTotal,
    totalVisits: total,
  }
}

// --- RATE LIMIT (sunucu tarafı) ---
export async function checkRateLimit(key: string): Promise<string | null> {
  const rows = await sql`SELECT fails, window_start FROM rate_limits WHERE key = ${key}`
  if (!rows.length) return null
  if (Date.now() - new Date(rows[0].window_start).getTime() > 15 * 60 * 1000) return null
  if (Number(rows[0].fails) >= 5) return 'Çok fazla hatalı deneme. Lütfen 15 dakika sonra tekrar deneyin.'
  return null
}
export async function recordFailedLogin(key: string) {
  await sql`
    INSERT INTO rate_limits (key, fails, window_start) VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      fails = CASE WHEN now() - rate_limits.window_start > interval '15 minutes' THEN 1 ELSE rate_limits.fails + 1 END,
      window_start = CASE WHEN now() - rate_limits.window_start > interval '15 minutes' THEN now() ELSE rate_limits.window_start END`
}
export async function clearRateLimit(key: string) {
  await sql`DELETE FROM rate_limits WHERE key = ${key}`
}