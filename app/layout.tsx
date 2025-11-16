import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ناجح البارودي - مرشح رئاسة مجلس ادارة نادي اسيوط الرياضي',
  description: 'ناجح البارودي - مرشح رئاسة مجلس ادارة نادي اسيوط الرياضي. نظام متطور ومحترف لإدارة فريق الانتخابات ومتابعة أعضائنا.',
  openGraph: {
    title: 'ناجح البارودي - مرشح رئاسة مجلس ادارة نادي اسيوط الرياضي',
    description: 'ناجح البارودي - مرشح رئاسة مجلس ادارة نادي اسيوط الرياضي. نظام متطور ومحترف لإدارة فريق الانتخابات ومتابعة أعضائنا.',
    images: [
      {
        url: '/img/Nageh%20thumb.jpg',
        width: 1200,
        height: 630,
        alt: 'ناجح البارودي - مرشح رئاسة مجلس ادارة نادي اسيوط الرياضي',
      },
    ],
    type: 'website',
    locale: 'ar',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ناجح البارودي - مرشح رئاسة مجلس ادارة نادي اسيوط الرياضي',
    description: 'ناجح البارودي - مرشح رئاسة مجلس ادارة نادي اسيوط الرياضي. نظام متطور ومحترف لإدارة فريق الانتخابات ومتابعة أعضائنا.',
    images: ['/img/Nageh%20thumb.jpg'],
  },
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


