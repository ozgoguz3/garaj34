import 'server-only'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'
import { normalizePlate, plateToSlug, type StepIndex } from '@/lib/jobs-store'

// Bu dosya sadece sunucuda çalışır (server-only). Tarayıcıya asla
// gönderilmez, veritabanı sorguları burada toplanır.

export type Business = {
  id: string
  slug: string
  name: string
}

export type Job = {
  id: string
  businessId: string
  customerName: string
  plate: string
  phone: string
  services: string[]
  step: StepIndex
  createdAt: string
}

export type ArchivedJob = {
  id: string
  businessId: string
  customerName: string
  plate: string
  phone: string
  services: string[]
  serviceDate: string
}

// ---------- İşletme (tenant) işlemleri ----------

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const rows = await sql`
    SELECT id, slug, name FROM businesses WHERE slug = ${slug} LIMIT 1
  `
  if (rows.length === 0) return null
  const r = rows[0] as any
  return { id: r.id, slug: r.slug, name: r.name }
}

export async function verifyBusinessPin(slug: string, pin: string): Promise<Business | null> {
  const rows = await sql`
    SELECT id, slug, name, pin_hash FROM businesses WHERE slug = ${slug} LIMIT 1
  `
  if (rows.length === 0) return null
  const r = rows[0] as any
  const ok = await bcrypt.compare(pin, r.pin_hash)
  if (!ok) return null
  return { id: r.id, slug: r.slug, name: r.name }
}

// Yeni bir işletme eklemek için (satış yaptığında kullanacaksın)
export async function createBusiness(slug: string, name: string, pin: string) {
  const pinHash = await bcrypt.hash(pin, 10)
  const rows = await sql`
    INSERT INTO businesses (slug, name, pin_hash)
    VALUES (${slug}, ${name}, ${pinHash})
    RETURNING id, slug, name
  `
  return rows[0] as Business
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
  input: { customerName?: string; plate: string; phone?: string; services: string[] },
): Promise<Job> {
  const rows = await sql`
    INSERT INTO jobs (business_id, customer_name, plate, phone, services, step)
    VALUES (
      ${businessId},
      ${input.customerName?.trim() || 'İsimsiz Müşteri'},
      ${normalizePlate(input.plate)},
      ${input.phone?.trim() || ''},
      ${input.services},
      0
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

// İşi arşive taşır (teslim edildi) ve aktif listeden kaldırır
export async function archiveJob(businessId: string, jobId: string) {
  const rows = await sql`
    SELECT * FROM jobs WHERE id = ${jobId} AND business_id = ${businessId}
  `
  if (rows.length === 0) return
  const job = mapJobRow(rows[0])

  await sql`
    INSERT INTO archived_jobs (business_id, customer_name, plate, phone, services, service_date)
    VALUES (${businessId}, ${job.customerName}, ${job.plate}, ${job.phone}, ${job.services}, now())
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

export type RetentionInsight = {
  plate: string
  customerName: string
  phone: string
  visitCount: number
  lastVisit: string
  isOverdue: boolean
}

// CRM sinyali: bu müşteri eskiden sık geliyordu ama son zamanlarda gelmiyor mu?
// (örn. ortalama ziyaret aralığının 2 katından fazla süre geçtiyse "geri kazanım adayı")
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
