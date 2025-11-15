import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'نادي ASC - انتخابات النادي',
  description: 'نظام إدارة انتخابات نادي ASC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}


