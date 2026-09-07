import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { JobsProvider } from '@/lib/jobs-store'
import './globals.css'

export const metadata: Metadata = {
  title: 'Garaj34 · Premium Oto Detaylama',
  description:
    'Garaj34 Premium Detailing için canlı araç takip ve mini CRM yönetim paneli.',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" className="dark bg-background">
      <body className="font-sans antialiased">
        <JobsProvider>{children}</JobsProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
