import { neon } from '@neondatabase/serverless'

// Vercel'in Neon entegrasyonu genelde DATABASE_URL olarak ekliyor,
// ama bazı kurulumlarda POSTGRES_URL ya da DATABASE_URL_UNPOOLED adıyla
// gelebiliyor. Hangisi varsa onu kullanıyoruz, böylece isim farkında
// kod kırılmıyor. Vercel > Settings > Environment Variables kısmından
// gerçek adı teyit edebilirsin.
const connectionString =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL_UNPOOLED

if (!connectionString) {
  throw new Error(
    'Veritabanı bağlantı adresi bulunamadı. Vercel proje ayarlarında DATABASE_URL (veya POSTGRES_URL) environment variable\'ının eklendiğinden emin ol.',
  )
}

// Neon'un serverless sürücüsü: her sorgu HTTP üzerinden gider, bu yüzden
// Next.js'in serverless/edge fonksiyonlarında bağlantı havuzu yönetimiyle
// uğraşmadan doğrudan kullanılabilir.
export const sql = neon(connectionString)
