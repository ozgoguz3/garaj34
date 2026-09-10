// lib/db.ts
import { neon } from '@neondatabase/serverless'
const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.DATABASE_URL_UNPOOLED
if (!connectionString) throw new Error('Veritabanı bağlantı adresi bulunamadı.')
export const sql = neon(connectionString)