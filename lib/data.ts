import 'server-only'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'
import { normalizePlate } from '@/lib/jobs-store'

// --- TİPLER ---
export type Organization = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  metadata: any
  createdAt: string
}

export type Customer = {
  id: string
  organizationId: string
  fullName: string
  phone: string | null
  createdAt: string
}

export type Vehicle = {
  id: string
  customerId: string | null
  organizationId: string
  plate: string
  brand: string | null
  model: string | null
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
  phone?: string
  carModel?: string
}

export type CampaignTarget = {
  plate: string
  customerName: string
  phone: string
  lastVisit: string
  services: string[]
}

export type RetentionInsight = {
  plate: string
  customerName: string
  phone: string
  visitCount: number
  lastVisit: string
  isOverdue: boolean
}

// --- ORGANİZASYON (TENANT) İŞLEMLERİ ---

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const rows = await sql`SELECT * FROM neon_auth.organization WHERE slug = ${slug} LIMIT 1`
  if (!rows.length) return null
  return {
    id: String(rows[0].id),
    slug: String(rows[0].slug),
    name: String(rows[0].name),
    logoUrl: rows[0].logo || null,
    metadata: rows[0].metadata || {},
    createdAt: String(rows[0].createdat)
  }
}

export async function updateOrganizationBranding(
  orgId: string,
  input: { logoUrl?: string; tagline?: string; primaryColor?: string }
) {
  await sql`
    UPDATE neon_auth.organization 
    SET logo = COALESCE(${input.logoUrl ?? null}, logo),
        metadata = jsonb_set(
          jsonb_set(COALESCE(metadata, '{}'::jsonb), '{tagline}', COALESCE(to_jsonb(${input.tagline}::text), metadata->'tagline')),
          '{primaryColor}', COALESCE(to_jsonb(${input.primaryColor}::text), metadata->'primaryColor')
        )
    WHERE id = ${orgId}
  `
}

// --- CRM & OPERASYON İŞLEMLERİ ---

export async function addVisit(
  orgId: string,
  input: {
    customerName?: string
    plate: string
    carModel?: string
    phone?: string
    services: string[]
    warrantyMonths?: number
    damageNote?: string
    internalNote?: string
  }
): Promise<Visit> {
  const customerName = input.customerName?.trim() || 'İsimsiz Müşteri'
  const phone = input.phone?.trim() || null
  const plate = normalizePlate(input.plate)
  const carModel = input.carModel?.trim() || null

  let warrantyEndDate = null
  if (input.warrantyMonths) {
    const d = new Date()
    d.setMonth(d.getMonth() + input.warrantyMonths)
    warrantyEndDate = d.toISOString()
  }

  let customerId = null
  if (phone) {
    const custRows = await sql`
      INSERT INTO customers (organization_id, full_name, phone)
      VALUES (${orgId}, ${customerName}, ${phone})
      ON CONFLICT (organization_id, phone) 
      DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id
    `
    customerId = custRows[0].id
  } else {
    const custRows = await sql`
      INSERT INTO customers (organization_id, full_name)
      VALUES (${orgId}, ${customerName})
      RETURNING id
    `
    customerId = custRows[0].id
  }

  const vehRows = await sql`
    INSERT INTO vehicles (organization_id, customer_id, plate, model)
    VALUES (${orgId}, ${customerId}, ${plate}, ${carModel})
    ON CONFLICT (organization_id, plate) 
    DO UPDATE SET customer_id = EXCLUDED.customer_id, model = COALESCE(EXCLUDED.model, vehicles.model)
    RETURNING id
  `
  const vehicleId = vehRows[0].id

  const visitRows = await sql`
    INSERT INTO visits (
      organization_id, vehicle_id, status, services, damage_note, internal_note, warranty_end_date
    ) VALUES (
      ${orgId}, ${vehicleId}, 'queued', ${input.services}, ${input.damageNote || null}, ${input.internalNote || null}, ${warrantyEndDate}
    )
    RETURNING *
  `
  
  return {
    ...visitRows[0],
    plate,
    customerName,
    phone,
    carModel
  } as Visit
}

export async function listActiveVisits(orgId: string): Promise<Visit[]> {
  const rows = await sql`
    SELECT v.*, veh.plate, veh.model as carModel, c.full_name as customerName, c.phone
    FROM visits v
    JOIN vehicles veh ON v.vehicle_id = veh.id
    LEFT JOIN customers c ON veh.customer_id = c.id
    WHERE v.organization_id = ${orgId} AND v.status IN ('queued', 'processing', 'ready')
    ORDER BY v.created_at DESC
  `
  return rows.map((r: any) => ({
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
    carModel: r.carmodel
  }))
}

export async function listCompletedVisits(orgId: string): Promise<Visit[]> {
  const rows = await sql`
    SELECT v.*, veh.plate, veh.model as carModel, c.full_name as customerName, c.phone
    FROM visits v
    JOIN vehicles veh ON v.vehicle_id = veh.id
    LEFT JOIN customers c ON veh.customer_id = c.id
    WHERE v.organization_id = ${orgId} AND v.status IN ('completed', 'cancelled')
    ORDER BY v.completed_at DESC NULLS LAST
  `
  return rows.map((r: any) => ({
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
    carModel: r.carmodel
  }))
}

export async function findVisitByPlate(orgId: string, slug: string): Promise<Visit | null> {
  const normalized = slug.toUpperCase()
  const rows = await sql`
    SELECT v.*, veh.plate, veh.model as carModel, c.full_name as customerName, c.phone
    FROM visits v
    JOIN vehicles veh ON v.vehicle_id = veh.id
    LEFT JOIN customers c ON veh.customer_id = c.id
    WHERE v.organization_id = ${orgId} 
      AND REPLACE(veh.plate, ' ', '') = ${normalized}
      AND v.status != 'cancelled'
    ORDER BY v.created_at DESC LIMIT 1
  `
  if (!rows.length) return null
  const r = rows[0]
  return {
    id: String(r.id), vehicleId: String(r.vehicle_id), organizationId: String(r.organization_id),
    status: r.status as VisitStatus, services: r.services || [], damageNote: r.damage_note,
    internalNote: r.internal_note, warrantyEndDate: r.warranty_end_date, createdAt: r.created_at,
    completedAt: r.completed_at, plate: r.plate, customerName: r.customername, phone: r.phone, carModel: r.carmodel
  }
}

export async function updateVisitStatus(orgId: string, visitId: string, status: VisitStatus) {
  const completedAt = status === 'completed' ? sql`NOW()` : null
  await sql`
    UPDATE visits 
    SET status = ${status}, completed_at = COALESCE(${completedAt}, completed_at)
    WHERE id = ${visitId} AND organization_id = ${orgId}
  `
}

// --- KAMPANYA VE DAVRANIŞ ANALİZİ ---

export async function getCampaignSegment(orgId: string, segment: string): Promise<CampaignTarget[]> {
  const base = sql`
    SELECT 
      veh.plate, 
      c.full_name as customer_name, 
      c.phone, 
      MAX(v.created_at) AS last_visit, 
      array_agg(DISTINCT unnest(v.services)) as all_services, 
      COUNT(v.id) as total_visits
    FROM visits v
    JOIN vehicles veh ON v.vehicle_id = veh.id
    JOIN customers c ON veh.customer_id = c.id
    WHERE v.organization_id = ${orgId} AND c.phone IS NOT NULL
    GROUP BY veh.plate, c.full_name, c.phone
  `
  const rows = await base
  const now = Date.now()

  // TypeScript'e ara verimizin tipini açıkça söylüyoruz
  type MappedTarget = {
    plate: string
    customerName: string
    phone: string
    lastVisit: string
    services: string[]
    daysSince: number
    totalVisits: number
  }

  const mapped: MappedTarget[] = rows.map((r: any) => ({
    plate: String(r.plate || ''),
    customerName: String(r.customer_name || ''),
    phone: String(r.phone || ''),
    lastVisit: String(r.last_visit || ''),
    services: Array.isArray(r.all_services) ? r.all_services.map(String) : [],
    daysSince: Math.floor((now - new Date(r.last_visit).getTime()) / (1000 * 60 * 60 * 24)),
    totalVisits: Number(r.total_visits || 0)
  }))

  let filtered = mapped

  if (segment === 'inactive_30') {
    filtered = mapped.filter((c) => c.daysSince >= 30 && c.daysSince < 60)
  } else if (segment === 'inactive_60') {
    filtered = mapped.filter((c) => c.daysSince >= 60)
  } else if (segment === 'ceramic_ppf_only') {
    filtered = mapped.filter((c) => c.services.some((s) => s.includes('Seramik') || s.includes('Film')))
  } else if (segment === 'high_value') {
    filtered = [...mapped].sort((a, b) => b.totalVisits - a.totalVisits).slice(0, 20)
  }

  // TypeScript'i mutlu etmek için fazladan eklediğimiz 'daysSince' ve 'totalVisits' verilerini
  // dışarıya yollamadan önce temizliyoruz (Sadece CampaignTarget tipini döndürüyoruz).
  return filtered.map(f => ({
    plate: f.plate,
    customerName: f.customerName,
    phone: f.phone,
    lastVisit: f.lastVisit,
    services: f.services
  }))
}

export async function getRetentionInsights(orgId: string): Promise<RetentionInsight[]> {
  const rows = await sql`
    SELECT veh.plate, c.full_name as customer_name, c.phone, array_agg(v.created_at ORDER BY v.created_at DESC) AS visit_dates
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
    
    // Hatanın çözüldüğü satır: a ve b için : number eklendi
    const avgGap = gaps.length > 0 ? gaps.reduce((a: number, b: number) => a + b, 0) / gaps.length : 0
    
    const sinceLast = now - (dates[0] || now)
    return {
      plate: String(r.plate || ''), 
      customerName: String(r.customer_name || ''), 
      phone: String(r.phone || ''),
      visitCount: dates.length, 
      lastVisit: new Date(dates[0] || now).toISOString(), 
      isOverdue: sinceLast > (avgGap * 1.5),
    }
  })
  
  return mapped.filter(c => c.isOverdue).sort((a, b) => new Date(a.lastVisit).getTime() - new Date(b.lastVisit).getTime())
}

export async function getServicePopularity(orgId: string) {
  const rows = await sql`
    SELECT unnest(services) AS service, COUNT(*) AS count
    FROM visits
    WHERE organization_id = ${orgId} AND status = 'completed'
    GROUP BY service
    ORDER BY count DESC
    LIMIT 8
  `
  return rows.map((r: any) => ({ service: String(r.service), count: Number(r.count) }))
}

export async function getBusiestWeekday(orgId: string) {
  const rows = await sql`
    SELECT extract(dow FROM created_at) AS weekday, COUNT(*) AS count
    FROM visits
    WHERE organization_id = ${orgId} AND status = 'completed'
    GROUP BY weekday
    ORDER BY count DESC
  `
  return rows.map((r: any) => ({ weekday: Number(r.weekday), count: Number(r.count) }))
}

export async function getNewVsReturningRatio(orgId: string) {
  const rows = await sql`
    SELECT vehicle_id, COUNT(*) AS visits
    FROM visits
    WHERE organization_id = ${orgId} AND status = 'completed'
    GROUP BY vehicle_id
  `
  const total = rows.length
  const returning = rows.filter((r: any) => Number(r.visits) > 1).length
  return { total, returning, new: total - returning }
}

export async function getMonthlyVisitTrend(orgId: string) {
  const rows = await sql`
    SELECT date_trunc('month', created_at) AS month, COUNT(*) AS visits
    FROM visits
    WHERE organization_id = ${orgId} AND status = 'completed' AND created_at > now() - interval '6 months'
    GROUP BY month
    ORDER BY month ASC
  `
  return rows.map((r: any) => ({ month: String(r.month), visits: Number(r.visits) }))
}

// --- EKSİK ESKİ OPERASYONEL FONKSİYONLAR (Actions uyumluluğu için) ---

export async function verifyBusinessPin(slug: string, pin: string): Promise<Business | null> {
  const rows = await sql`SELECT * FROM businesses WHERE slug = ${slug} LIMIT 1`
  if (!rows.length) return null
  const ok = await bcrypt.compare(pin, rows[0].pin_hash)
  return ok ? mapBusinessRow(rows[0]) : null
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const rows = await sql`SELECT * FROM businesses WHERE slug = ${slug} LIMIT 1`
  return rows.length ? mapBusinessRow(rows[0]) : null
}

export type Business = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  primaryColor: string
  tagline: string
  googleMapsUrl: string | null
}

function mapBusinessRow(r: any): Business {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    logoUrl: r.logo_url || null,
    primaryColor: String(r.primary_color || '#10b981'),
    tagline: String(r.tagline || ''),
    googleMapsUrl: r.google_maps_url || null,
  }
}

export async function addJob(
  businessId: string,
  input: {
    customerName?: string
    plate: string
    carModel?: string
    phone?: string
    services: string[]
    warrantyMonths?: number
    damageNote?: string
    customerNotes?: string
  },
) {
  let warrantyEndDate = null
  if (input.warrantyMonths) {
    const d = new Date()
    d.setMonth(d.getMonth() + input.warrantyMonths)
    warrantyEndDate = d.toISOString()
  }

  const customerName = input.customerName?.trim() || 'İsimsiz Müşteri'
  const plate = normalizePlate(input.plate)
  const carModel = input.carModel?.trim() || null
  const phone = input.phone?.trim() || ''
  const damageNote = input.damageNote?.trim() || null
  const customerNotes = input.customerNotes?.trim() || null

  const rows = await sql`
    INSERT INTO jobs (
      business_id, customer_name, plate, car_model, phone, services, step, 
      warranty_end_date, damage_note, customer_notes, price, payment_status
    )
    VALUES (
      ${businessId}, ${customerName}, ${plate}, ${carModel}, ${phone}, 
      ${input.services}, 0, ${warrantyEndDate}, ${damageNote}, ${customerNotes}, 0, 'paid'
    )
    RETURNING *
  `
  return rows[0]
}

export async function setJobStep(businessId: string, jobId: string, step: any) {
  await sql`UPDATE jobs SET step = ${step} WHERE id = ${jobId} AND business_id = ${businessId}`
}

export async function archiveJob(businessId: string, jobId: string) {
  await sql`
    WITH moved_job AS (
      DELETE FROM jobs WHERE id = ${jobId} AND business_id = ${businessId} RETURNING *
    )
    INSERT INTO archived_jobs (
      business_id, customer_name, plate, phone, services, warranty_end_date, 
      service_date, car_model, damage_note, customer_notes, price, payment_status
    )
    SELECT 
      business_id, customer_name, plate, phone, services, warranty_end_date, 
      now(), car_model, damage_note, customer_notes, 0, 'paid'
    FROM moved_job;
  `
}

export async function updateBusinessBranding(
  businessId: string,
  input: { logoUrl?: string; primaryColor?: string; tagline?: string; googleMapsUrl?: string },
) {
  await sql`
    UPDATE businesses SET
      logo_url = COALESCE(${input.logoUrl ?? null}, logo_url),
      primary_color = COALESCE(${input.primaryColor ?? null}, primary_color),
      tagline = COALESCE(${input.tagline ?? null}, tagline),
      google_maps_url = COALESCE(${input.googleMapsUrl ?? null}, google_maps_url)
    WHERE id = ${businessId}
  `
}

export async function addJobPhoto(jobId: string, photoUrl: string, photoType: 'before' | 'after') {
  await sql`INSERT INTO job_photos (job_id, photo_url, photo_type) VALUES (${jobId}, ${photoUrl}, ${photoType})`
}

export type Business = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  primaryColor: string
  tagline: string
  googleMapsUrl: string | null
}

function mapBusinessRow(r: any): Business {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    logoUrl: r.logo_url || null,
    primaryColor: String(r.primary_color || '#10b981'),
    tagline: String(r.tagline || ''),
    googleMapsUrl: r.google_maps_url || null,
  }
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const rows = await sql`SELECT * FROM businesses WHERE slug = ${slug} LIMIT 1`
  return rows.length ? mapBusinessRow(rows[0]) : null
}

export async function verifyBusinessPin(slug: string, pin: string): Promise<Business | null> {
  const rows = await sql`SELECT * FROM businesses WHERE slug = ${slug} LIMIT 1`
  if (!rows.length) return null
  const ok = await bcrypt.compare(pin, rows[0].pin_hash)
  return ok ? mapBusinessRow(rows[0]) : null
}