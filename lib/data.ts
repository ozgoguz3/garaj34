import 'server-only'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'
import { normalizePlate, type StepIndex } from '@/lib/jobs-store'

export type Business = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  primaryColor: string
  tagline: string
  googleMapsUrl: string | null
}

export type Job = {
  id: string
  businessId: string
  customerName: string
  plate: string
  phone: string
  services: string[]
  step: StepIndex
  warrantyEndDate: string | null
  createdAt: string
  carModel: string | null
  damageNote: string | null
  customerNotes: string | null
}

export type ArchivedJob = {
  id: string
  businessId: string
  customerName: string
  plate: string
  phone: string
  services: string[]
  warrantyEndDate: string | null
  serviceDate: string
  carModel: string | null
  damageNote: string | null
  customerNotes: string | null
}

export type RetentionInsight = {
  plate: string
  customerName: string
  phone: string
  visitCount: number
  lastVisit: string
  isOverdue: boolean
}

export type ExpiringWarranty = {
  plate: string
  customerName: string
  phone: string
  service: string
  warrantyEndDate: string
  daysLeft: number
}

export type DashboardSummary = {
  activeCount: number
  monthJobCount: number
  totalCustomers: number
  returningRate: number
}

export type CampaignSegment = 'inactive_30' | 'inactive_60' | 'all_customers' | 'ceramic_ppf_only' | 'high_value'

export type CampaignTarget = {
  plate: string
  customerName: string
  phone: string
  lastVisit: string
  services: string[]
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

function mapJobRow(r: any): Job {
  return {
    id: String(r.id),
    businessId: String(r.business_id),
    customerName: String(r.customer_name || ''),
    plate: String(r.plate || ''),
    phone: String(r.phone || ''),
    services: Array.isArray(r.services) ? r.services.map(String) : [],
    step: Number(r.step) as StepIndex,
    warrantyEndDate: r.warranty_end_date || null,
    createdAt: r.created_at || new Date().toISOString(),
    carModel: r.car_model || null,
    damageNote: r.damage_note || null,
    customerNotes: r.customer_notes || null,
  }
}

export async function listActiveJobs(businessId: string): Promise<Job[]> {
  const rows = await sql`SELECT * FROM jobs WHERE business_id = ${businessId} ORDER BY created_at DESC`
  return rows.map(mapJobRow)
}

export async function findJobByPlate(businessId: string, slug: string): Promise<Job | null> {
  const normalized = slug.toUpperCase()
  const rows = await sql`
    SELECT * FROM jobs 
    WHERE business_id = ${businessId} AND REPLACE(plate, ' ', '') = ${normalized}
    LIMIT 1
  `
  return rows.length ? mapJobRow(rows[0]) : null
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
): Promise<Job> {
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
  return mapJobRow(rows[0])
}

export async function setJobStep(businessId: string, jobId: string, step: StepIndex) {
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

function mapArchiveRow(r: any): ArchivedJob {
  return {
    id: String(r.id),
    businessId: String(r.business_id),
    customerName: String(r.customer_name || ''),
    plate: String(r.plate || ''),
    phone: String(r.phone || ''),
    services: Array.isArray(r.services) ? r.services.map(String) : [],
    warrantyEndDate: r.warranty_end_date || null,
    serviceDate: String(r.service_date || new Date().toISOString()),
    carModel: r.car_model || null,
    damageNote: r.damage_note || null,
    customerNotes: r.customer_notes || null,
  }
}

export async function listArchive(businessId: string): Promise<ArchivedJob[]> {
  const rows = await sql`SELECT * FROM archived_jobs WHERE business_id = ${businessId} ORDER BY service_date DESC`
  return rows.map(mapArchiveRow)
}

export async function getDashboardSummary(businessId: string): Promise<DashboardSummary> {
  const [activeRows, archiveRows, customersRows] = await Promise.all([
    sql`SELECT COUNT(*) AS c FROM jobs WHERE business_id = ${businessId}`,
    sql`SELECT COUNT(*) AS c FROM archived_jobs WHERE business_id = ${businessId} AND date_trunc('month', service_date) = date_trunc('month', now())`,
    sql`SELECT plate, COUNT(*) as visits FROM archived_jobs WHERE business_id = ${businessId} GROUP BY plate`
  ])

  const totalCustomers = customersRows.length
  const returningCount = customersRows.filter((r: any) => Number(r.visits) > 1).length
  const returningRate = totalCustomers > 0 ? Math.round((returningCount / totalCustomers) * 100) : 0

  return {
    activeCount: Number(activeRows[0]?.c || 0),
    monthJobCount: Number(archiveRows[0]?.c || 0),
    totalCustomers,
    returningRate,
  }
}

export async function getExpiringWarranties(businessId: string): Promise<ExpiringWarranty[]> {
  const rows = await sql`
    SELECT plate, customer_name, phone, services, warranty_end_date
    FROM archived_jobs
    WHERE business_id = ${businessId}
      AND warranty_end_date IS NOT NULL
      AND warranty_end_date > now()
      AND warranty_end_date < now() + interval '45 days'
    ORDER BY warranty_end_date ASC
  `
  const now = Date.now()
  return rows.map((r: any): ExpiringWarranty => {
    const srv = Array.isArray(r.services) ? r.services : []
    const eligibleService = srv.find((s: string) => s.includes('Seramik') || s.includes('Film')) || 'Kaplama Hizmeti'
    return {
      plate: String(r.plate || ''),
      customerName: String(r.customer_name || ''),
      phone: String(r.phone || ''),
      service: String(eligibleService),
      warrantyEndDate: String(r.warranty_end_date),
      daysLeft: Math.ceil((new Date(r.warranty_end_date).getTime() - now) / (1000 * 60 * 60 * 24)),
    }
  })
}

export async function getCampaignSegment(businessId: string, segment: CampaignSegment): Promise<CampaignTarget[]> {
  const base = sql`
    SELECT plate, customer_name, phone, MAX(service_date) AS last_visit, array_agg(DISTINCT unnest(services)) as all_services, COUNT(*) as total_visits
    FROM archived_jobs
    WHERE business_id = ${businessId} AND phone != ''
    GROUP BY plate, customer_name, phone
  `
  const rows = await base
  const now = Date.now()

  const mapped = rows.map((r: any) => ({
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
    filtered = mapped.filter(c => c.daysSince >= 30 && c.daysSince < 60)
  } else if (segment === 'inactive_60') {
    filtered = mapped.filter(c => c.daysSince >= 60)
  } else if (segment === 'ceramic_ppf_only') {
    filtered = mapped.filter(c => c.services.some(s => s.includes('Seramik') || s.includes('Film')))
  } else if (segment === 'high_value') {
    filtered = mapped.sort((a, b) => b.totalVisits - a.totalVisits).slice(0, 20)
  }

  return filtered.map(f => ({
    plate: f.plate,
    customerName: f.customerName,
    phone: f.phone,
    lastVisit: f.lastVisit,
    services: f.services
  }))
}

export async function getRetentionInsights(businessId: string): Promise<RetentionInsight[]> {
  const rows = await sql`
    SELECT plate, customer_name, phone, array_agg(service_date ORDER BY service_date DESC) AS visits
    FROM archived_jobs
    WHERE business_id = ${businessId}
    GROUP BY plate, customer_name, phone
    HAVING count(*) >= 2
  `
  const now = Date.now()
  const mapped: RetentionInsight[] = rows.map((r: any) => {
    const visitArr = Array.isArray(r.visits) ? r.visits : []
    const dates = visitArr.map((v: string) => new Date(v).getTime()).sort((a: number, b: number) => b - a)
    const gaps = dates.slice(0, -1).map((d: number, i: number) => d - dates[i + 1])
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

export async function getServicePopularity(businessId: string) {
  const rows = await sql`
    SELECT unnest(services) AS service, COUNT(*) AS count
    FROM archived_jobs
    WHERE business_id = ${businessId}
    GROUP BY service
    ORDER BY count DESC
    LIMIT 8
  `
  return rows.map((r: any) => ({ service: String(r.service), count: Number(r.count) }))
}

export async function getBusiestWeekday(businessId: string) {
  const rows = await sql`
    SELECT extract(dow FROM service_date) AS weekday, COUNT(*) AS count
    FROM archived_jobs
    WHERE business_id = ${businessId}
    GROUP BY weekday
    ORDER BY count DESC
  `
  return rows.map((r: any) => ({ weekday: Number(r.weekday), count: Number(r.count) }))
}

export async function getNewVsReturningRatio(businessId: string) {
  const rows = await sql`
    SELECT plate, COUNT(*) AS visits
    FROM archived_jobs
    WHERE business_id = ${businessId}
    GROUP BY plate
  `
  const total = rows.length
  const returning = rows.filter((r: any) => Number(r.visits) > 1).length
  return { total, returning, new: total - returning }
}

export async function getMonthlyVisitTrend(businessId: string) {
  const rows = await sql`
    SELECT date_trunc('month', service_date) AS month, COUNT(*) AS visits
    FROM archived_jobs
    WHERE business_id = ${businessId} AND service_date > now() - interval '6 months'
    GROUP BY month
    ORDER BY month ASC
  `
  return rows.map((r: any) => ({ month: String(r.month), visits: Number(r.visits) }))
}

export async function addJobPhoto(jobId: string, photoUrl: string, photoType: 'before' | 'after') {
  await sql`INSERT INTO job_photos (job_id, photo_url, photo_type) VALUES (${jobId}, ${photoUrl}, ${photoType})`
}