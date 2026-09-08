import 'server-only'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'
import { normalizePlate, plateToSlug, type StepIndex } from '@/lib/jobs-store'

export type Business = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  primaryColor: string
  tagline: string
  googleMapsUrl: string | null
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
    id: r.id,
    slug: r.slug,
    name: r.name,
    logoUrl: r.logo_url,
    primaryColor: r.primary_color,
    tagline: r.tagline,
    googleMapsUrl: r.google_maps_url,
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

function mapJobRow(r: any) {
  return {
    id: r.id,
    businessId: r.business_id,
    customerName: r.customer_name,
    plate: r.plate,
    phone: r.phone,
    services: r.services ?? [],
    step: r.step as StepIndex,
    warrantyEndDate: r.warranty_end_date,
    createdAt: r.created_at,
    carModel: r.car_model,
    damageNote: r.damage_note,
    customerNotes: r.customer_notes,
  }
}

export async function listActiveJobs(businessId: string) {
  const rows = await sql`SELECT * FROM jobs WHERE business_id = ${businessId} ORDER BY created_at DESC`
  return rows.map(mapJobRow)
}

export async function findJobByPlate(businessId: string, slug: string) {
  const normalized = slug.toUpperCase()
  // Plaka boşluklarını silip direkt veritabanında arayarak süper hız sağladık
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
) {
  let warrantyEndDate = null
  if (input.warrantyMonths) {
    const d = new Date()
    d.setMonth(d.getMonth() + input.warrantyMonths) // Takvimsel doğru hesap
    warrantyEndDate = d.toISOString()
  }

  const rows = await sql`
    INSERT INTO jobs (
      business_id, customer_name, plate, car_model, phone, services, step, 
      warranty_end_date, damage_note, customer_notes
    )
    VALUES (
      ${businessId}, ${input.customerName?.trim() || 'İsimsiz Müşteri'}, ${normalizePlate(input.plate)}, 
      ${input.carModel?.trim() || null}, ${input.phone?.trim() || ''}, ${input.services}, 0, 
      ${warrantyEndDate}, ${input.damageNote?.trim() || null}, ${input.customerNotes?.trim() || null}
    )
    RETURNING *
  `
  return mapJobRow(rows[0])
}

export async function setJobStep(businessId: string, jobId: string, step: StepIndex) {
  await sql`UPDATE jobs SET step = ${step} WHERE id = ${jobId} AND business_id = ${businessId}`
}

// ATOMIC ARCHIVE (Tek seferde siler ve yazar, hataya yer bırakmaz)
export async function archiveJob(businessId: string, jobId: string) {
  await sql`
    WITH moved_job AS (
      DELETE FROM jobs WHERE id = ${jobId} AND business_id = ${businessId} RETURNING *
    )
    INSERT INTO archived_jobs (
      business_id, customer_name, plate, phone, services, warranty_end_date, 
      service_date, car_model, damage_note, customer_notes
    )
    SELECT 
      business_id, customer_name, plate, phone, services, warranty_end_date, 
      now(), car_model, damage_note, customer_notes 
    FROM moved_job;
  `
}

function mapArchiveRow(r: any) {
  return {
    id: r.id,
    businessId: r.business_id,
    customerName: r.customer_name,
    plate: r.plate,
    phone: r.phone,
    services: r.services ?? [],
    warrantyEndDate: r.warranty_end_date,
    serviceDate: r.service_date,
    carModel: r.car_model,
    damageNote: r.damage_note,
    customerNotes: r.customer_notes,
  }
}

export async function listArchive(businessId: string) {
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
    activeCount: Number(activeRows[0].c),
    monthJobCount: Number(archiveRows[0].c),
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
  return rows.map((r: any) => {
    // Sadece garanti kapsamına giren hizmeti bulur
    const eligibleService = r.services?.find((s: string) => s.includes('Seramik') || s.includes('Film')) || 'Kaplama Hizmeti'
    return {
      plate: r.plate,
      customerName: r.customer_name,
      phone: r.phone,
      service: eligibleService,
      warrantyEndDate: r.warranty_end_date,
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
    plate: r.plate,
    customerName: r.customer_name,
    phone: r.phone,
    lastVisit: r.last_visit,
    services: r.all_services || [],
    daysSince: (now - new Date(r.last_visit).getTime()) / (1000 * 60 * 60 * 24),
    totalVisits: Number(r.total_visits)
  }))

  switch (segment) {
    case 'inactive_30': return mapped.filter(c => c.daysSince >= 30 && c.daysSince < 60)
    case 'inactive_60': return mapped.filter(c => c.daysSince >= 60)
    case 'ceramic_ppf_only': return mapped.filter(c => c.services.some((s: string) => s.includes('Seramik') || s.includes('Film')))
    case 'high_value': return mapped.sort((a, b) => b.totalVisits - a.totalVisits).slice(0, 20) // En sadıklar
    case 'all_customers': default: return mapped
  }
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
  return rows.map((r: any) => {
    const dates = r.visits.map((v: string) => new Date(v).getTime()).sort((a: any, b: any) => b - a)
    const gaps = dates.slice(0, -1).map((d: number, i: number) => d - dates[i + 1])
    const avgGap = gaps.reduce((a: number, b: number) => a + b, 0) / gaps.length
    const sinceLast = now - dates[0]
    return {
      plate: r.plate,
      customerName: r.customer_name,
      phone: r.phone,
      visitCount: dates.length,
      lastVisit: new Date(dates[0]).toISOString(),
      isOverdue: sinceLast > (avgGap * 1.5), // Mantıklı overdue hesabı (1.5 katı sapma)
    }
  }).filter((c) => c.isOverdue).sort((a, b) => new Date(a.lastVisit).getTime() - new Date(b.lastVisit).getTime())
}

export async function addJobPhoto(jobId: string, photoUrl: string, photoType: 'before' | 'after') {
  await sql`INSERT INTO job_photos (job_id, photo_url, photo_type) VALUES (${jobId}, ${photoUrl}, ${photoType})`
}