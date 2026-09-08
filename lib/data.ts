import 'server-only'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'
import { normalizePlate, plateToSlug, type StepIndex, type PaymentStatus } from '@/lib/jobs-store'

// Bu dosya sadece sunucuda çalışır (server-only). Tarayıcıya asla
// gönderilmez, veritabanı sorguları burada toplanır.

export type Business = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  primaryColor: string
  tagline: string
}

export type Job = {
  id: string
  businessId: string
  customerName: string
  plate: string
  phone: string
  services: string[]
  step: StepIndex
  price: number
  paymentStatus: PaymentStatus
  warrantyEndDate: string | null
  createdAt: string
}

export type ArchivedJob = {
  id: string
  businessId: string
  customerName: string
  plate: string
  phone: string
  services: string[]
  price: number
  paymentStatus: PaymentStatus
  warrantyEndDate: string | null
  serviceDate: string
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
  monthRevenue: number
  outstandingDebt: number
  avgTicket: number
  activeCount: number
  monthJobCount: number
}

// ---------- İşletme (tenant) işlemleri ----------

function mapBusinessRow(r: any): Business {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    logoUrl: r.logo_url,
    primaryColor: r.primary_color,
    tagline: r.tagline,
  }
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const rows = await sql`
    SELECT id, slug, name, logo_url, primary_color, tagline FROM businesses WHERE slug = ${slug} LIMIT 1
  `
  if (rows.length === 0) return null
  return mapBusinessRow(rows[0])
}

export async function verifyBusinessPin(slug: string, pin: string): Promise<Business | null> {
  const rows = await sql`
    SELECT id, slug, name, logo_url, primary_color, tagline, pin_hash FROM businesses WHERE slug = ${slug} LIMIT 1
  `
  if (rows.length === 0) return null
  const r = rows[0] as any
  const ok = await bcrypt.compare(pin, r.pin_hash)
  if (!ok) return null
  return mapBusinessRow(r)
}

export async function createBusiness(slug: string, name: string, pin: string) {
  const pinHash = await bcrypt.hash(pin, 10)
  const rows = await sql`
    INSERT INTO businesses (slug, name, pin_hash)
    VALUES (${slug}, ${name}, ${pinHash})
    RETURNING id, slug, name, logo_url, primary_color, tagline
  `
  return mapBusinessRow(rows[0])
}

export async function updateBusinessBranding(
  businessId: string,
  input: { logoUrl?: string; primaryColor?: string; tagline?: string },
) {
  await sql`
    UPDATE businesses SET
      logo_url = COALESCE(${input.logoUrl ?? null}, logo_url),
      primary_color = COALESCE(${input.primaryColor ?? null}, primary_color),
      tagline = COALESCE(${input.tagline ?? null}, tagline)
    WHERE id = ${businessId}
  `
}

// ---------- Aktif işler ----------

function mapJobRow(r: any): Job {
  return {
    id: r.id,
    businessId: r.business_id,
    customerName: r.customer_name,
    plate: r.plate,
    phone: r.phone,
    services: r.services ?? [],
    step: r.step as StepIndex,
    price: Number(r.price),
    paymentStatus: r.payment_status as PaymentStatus,
    warrantyEndDate: r.warranty_end_date,
    createdAt: r.created_at,
  }
}

export async function listActiveJobs(businessId: string): Promise<Job[]> {
  const rows = await sql`
    SELECT * FROM jobs WHERE business_id = ${businessId} ORDER BY created_at DESC
  `
  return rows.map(mapJobRow)
}

export async function findJobByPlate(businessId: string, slug: string): Promise<Job | null> {
  const rows = await sql`
    SELECT * FROM jobs WHERE business_id = ${businessId}
  `
  const match = rows.map(mapJobRow).find((j) => plateToSlug(j.plate) === slug.toUpperCase())
  return match ?? null
}

export async function addJob(
  businessId: string,
  input: {
    customerName?: string
    plate: string
    phone?: string
    services: string[]
    price?: number
    warrantyMonths?: number
  },
): Promise<Job> {
  const warrantyEndDate = input.warrantyMonths
    ? new Date(Date.now() + input.warrantyMonths * 30 * 24 * 60 * 60 * 1000).toISOString()
    : null

  const rows = await sql`
    INSERT INTO jobs (business_id, customer_name, plate, phone, services, step, price, warranty_end_date)
    VALUES (
      ${businessId},
      ${input.customerName?.trim() || 'İsimsiz Müşteri'},
      ${normalizePlate(input.plate)},
      ${input.phone?.trim() || ''},
      ${input.services},
      0,
      ${input.price ?? 0},
      ${warrantyEndDate}
    )
    RETURNING *
  `
  return mapJobRow(rows[0])
}

export async function setJobStep(businessId: string, jobId: string, step: StepIndex) {
  await sql`
    UPDATE jobs SET step = ${step}
    WHERE id = ${jobId} AND business_id = ${businessId}
  `
}

export async function setJobPaymentStatus(businessId: string, jobId: string, status: PaymentStatus) {
  await sql`
    UPDATE jobs SET payment_status = ${status}
    WHERE id = ${jobId} AND business_id = ${businessId}
  `
}

// İşi arşive taşır (teslim edildi) ve aktif listeden kaldırır
export async function archiveJob(businessId: string, jobId: string) {
  const rows = await sql`
    SELECT * FROM jobs WHERE id = ${jobId} AND business_id = ${businessId}
  `
  if (rows.length === 0) return
  const job = mapJobRow(rows[0])

  await sql`
    INSERT INTO archived_jobs (business_id, customer_name, plate, phone, services, price, payment_status, warranty_end_date, service_date)
    VALUES (${businessId}, ${job.customerName}, ${job.plate}, ${job.phone}, ${job.services}, ${job.price}, ${job.paymentStatus}, ${job.warrantyEndDate}, now())
  `
  await sql`DELETE FROM jobs WHERE id = ${jobId} AND business_id = ${businessId}`
}

// ---------- Arşiv / CRM ----------

function mapArchiveRow(r: any): ArchivedJob {
  return {
    id: r.id,
    businessId: r.business_id,
    customerName: r.customer_name,
    plate: r.plate,
    phone: r.phone,
    services: r.services ?? [],
    price: Number(r.price),
    paymentStatus: r.payment_status as PaymentStatus,
    warrantyEndDate: r.warranty_end_date,
    serviceDate: r.service_date,
  }
}

export async function listArchive(businessId: string): Promise<ArchivedJob[]> {
  const rows = await sql`
    SELECT * FROM archived_jobs WHERE business_id = ${businessId} ORDER BY service_date DESC
  `
  return rows.map(mapArchiveRow)
}

export async function getHistoryByPlate(businessId: string, plate: string): Promise<ArchivedJob[]> {
  const normalized = normalizePlate(plate)
  const rows = await sql`
    SELECT * FROM archived_jobs
    WHERE business_id = ${businessId} AND plate = ${normalized}
    ORDER BY service_date DESC
  `
  return rows.map(mapArchiveRow)
}

// CRM sinyali: bu müşteri eskiden sık geliyordu ama son zamanlarda gelmiyor mu?
export async function getRetentionInsights(businessId: string): Promise<RetentionInsight[]> {
  const rows = await sql`
    SELECT plate, customer_name, phone, array_agg(service_date ORDER BY service_date DESC) AS visits
    FROM archived_jobs
    WHERE business_id = ${businessId}
    GROUP BY plate, customer_name, phone
    HAVING count(*) >= 2
  `
  const now = Date.now()
  return rows
    .map((r: any) => {
      const visits: string[] = r.visits
      const dates = visits.map((v) => new Date(v).getTime()).sort((a, b) => b - a)
      const gaps = dates.slice(0, -1).map((d, i) => d - dates[i + 1])
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
      const sinceLast = now - dates[0]
      return {
        plate: r.plate,
        customerName: r.customer_name,
        phone: r.phone,
        visitCount: dates.length,
        lastVisit: new Date(dates[0]).toISOString(),
        isOverdue: sinceLast > avgGap * 2,
      }
    })
    .filter((c) => c.isOverdue)
    .sort((a, b) => new Date(a.lastVisit).getTime() - new Date(b.lastVisit).getTime())
}

// Garantisi 45 gün içinde bitecek müşteriler (seramik/PPF gibi hizmetler için)
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
  return rows.map((r: any) => ({
    plate: r.plate,
    customerName: r.customer_name,
    phone: r.phone,
    service: (r.services ?? [])[0] ?? 'Kaplama Hizmeti',
    warrantyEndDate: r.warranty_end_date,
    daysLeft: Math.ceil((new Date(r.warranty_end_date).getTime() - now) / (1000 * 60 * 60 * 24)),
  }))
}

// Panelin en üstündeki özet rakamlar: bu ay ciro, toplam alacak, ortalama fiş
export async function getDashboardSummary(businessId: string): Promise<DashboardSummary> {
  const [revenueRows, debtRows, activeRows] = await Promise.all([
    sql`
      SELECT
        COALESCE(SUM(price), 0) AS revenue,
        COALESCE(AVG(price), 0) AS avg_ticket,
        COUNT(*) AS job_count
      FROM archived_jobs
      WHERE business_id = ${businessId}
        AND service_date >= date_trunc('month', now())
    `,
    sql`
      SELECT COALESCE(SUM(price), 0) AS debt
      FROM archived_jobs
      WHERE business_id = ${businessId} AND payment_status != 'paid'
    `,
    sql`
      SELECT COUNT(*) AS active_count FROM jobs WHERE business_id = ${businessId}
    `,
  ])

  return {
    monthRevenue: Number(revenueRows[0].revenue),
    avgTicket: Number(revenueRows[0].avg_ticket),
    monthJobCount: Number(revenueRows[0].job_count),
    outstandingDebt: Number(debtRows[0].debt),
    activeCount: Number(activeRows[0].active_count),
  }
}

// Son N müşteri (panel ana ekranında hızlı önizleme için)
export async function getRecentCustomers(businessId: string, limit = 5): Promise<ArchivedJob[]> {
  const rows = await sql`
    SELECT * FROM archived_jobs WHERE business_id = ${businessId}
    ORDER BY service_date DESC LIMIT ${limit}
  `
  return rows.map(mapArchiveRow)
}

// ---------- Kampanya segmentleri ----------

export type CampaignSegment = 'inactive_30' | 'inactive_60' | 'all_customers' | 'high_value'

export type CampaignTarget = {
  plate: string
  customerName: string
  phone: string
  lastVisit: string
}

export async function getCampaignSegment(businessId: string, segment: CampaignSegment): Promise<CampaignTarget[]> {
  const base = sql`
    SELECT plate, customer_name, phone, MAX(service_date) AS last_visit, SUM(price) AS total_spent
    FROM archived_jobs
    WHERE business_id = ${businessId} AND phone != ''
    GROUP BY plate, customer_name, phone
  `
  const rows = await base

  const now = Date.now()
  const withGap = rows.map((r: any) => ({
    plate: r.plate,
    customerName: r.customer_name,
    phone: r.phone,
    lastVisit: r.last_visit,
    totalSpent: Number(r.total_spent),
    daysSince: (now - new Date(r.last_visit).getTime()) / (1000 * 60 * 60 * 24),
  }))

  switch (segment) {
    case 'inactive_30':
      return withGap.filter((c) => c.daysSince >= 30 && c.daysSince < 60)
    case 'inactive_60':
      return withGap.filter((c) => c.daysSince >= 60)
    case 'high_value':
      return withGap
        .filter((c) => c.totalSpent > 0)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 20)
    case 'all_customers':
    default:
      return withGap
  }
}

// ---------- Analiz sayfası sorguları ----------

export async function getServicePopularity(businessId: string) {
  const rows = await sql`
    SELECT unnest(services) AS service, COUNT(*) AS count
    FROM archived_jobs
    WHERE business_id = ${businessId}
    GROUP BY service
    ORDER BY count DESC
    LIMIT 8
  `
  return rows.map((r: any) => ({ service: r.service, count: Number(r.count) }))
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

export async function getMonthlyRevenueTrend(businessId: string) {
  const rows = await sql`
    SELECT date_trunc('month', service_date) AS month, SUM(price) AS revenue
    FROM archived_jobs
    WHERE business_id = ${businessId} AND service_date > now() - interval '6 months'
    GROUP BY month
    ORDER BY month ASC
  `
  return rows.map((r: any) => ({ month: r.month, revenue: Number(r.revenue) }))
}
