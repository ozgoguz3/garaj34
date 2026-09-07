// Tek seferlik kurulum betiği — kendi işletmeni veritabanına ekler.
//
// Kullanım (proje klasöründe terminalde):
//   npm install bcryptjs @neondatabase/serverless
//   node scripts/seed-business.mjs
//
// DATABASE_URL'i .env.local dosyandan otomatik okur. Yoksa aşağıdaki
// SLUG / NAME / PIN değerlerini kendine göre değiştirip tekrar çalıştırabilirsin.

import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'node:fs'

const SLUG = 'garaj34'
const NAME = 'Garaj34 Premium Detailing'
const PIN = '3434'

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  try {
    const envFile = readFileSync('.env.local', 'utf8')
    const match = envFile.match(/^DATABASE_URL="?(.+?)"?$/m)
    if (match) return match[1]
  } catch {}
  throw new Error(
    'DATABASE_URL bulunamadı. `vercel env pull .env.local` komutuyla Vercel\'deki değişkenleri indirebilir ya da .env.local dosyasına elle ekleyebilirsin.',
  )
}

const sql = neon(loadDatabaseUrl())
const pinHash = await bcrypt.hash(PIN, 10)

const rows = await sql`
  INSERT INTO businesses (slug, name, pin_hash)
  VALUES (${SLUG}, ${NAME}, ${pinHash})
  ON CONFLICT (slug) DO UPDATE SET pin_hash = EXCLUDED.pin_hash
  RETURNING id, slug, name
`

console.log('İşletme eklendi/güncellendi:', rows[0])
console.log(`Admin giriş adresin: /admin/${SLUG}  (PIN: ${PIN})`)
