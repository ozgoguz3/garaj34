// app/layout.tsx
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
export const metadata: Metadata = {
  title: { default: 'Garaj34', template: '%s · Garaj34' },
  description: 'Premium Detailing & Oto Yıkama Yönetim Sistemi',
  themeColor: '#0a0a0a',
}
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className={geist.variable}>{children}</body>
    </html>
  )
}