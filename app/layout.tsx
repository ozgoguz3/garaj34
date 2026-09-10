// app/layout.tsx
import type { Metadata } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk' })
const jbmono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jbmono' })

export const metadata: Metadata = {
  title: { default: 'Garaj34', template: '%s · Garaj34' },
  description: 'Detaylı bakım ve kaplama atölyeleri için canlı araç takibi ve müşteri yönetim sistemi.',
  themeColor: '#101418',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} ${grotesk.variable} ${jbmono.variable}`}>{children}</body>
    </html>
  )
}