import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Garaj34',
  description: 'Premium Detailing Yönetim Sistemi',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}