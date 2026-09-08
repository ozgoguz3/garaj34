import { neon } from '@neondatabase/serverless'

const connectionString =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL_UNPOOLED

if (!connectionString) {
  throw new Error(
    'Veritabanı bağlantı adresi bulunamadı. Vercel proje ayarlarında DATABASE_URL (veya POSTGRES_URL) environment variable\'ının eklendiğinden emin ol.'
  )
}

export const sql = neon(connectionString)