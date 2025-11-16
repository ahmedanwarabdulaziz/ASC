import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ناجح البارودي - مرشح رئاسة مجلس ادارة نادي اسيوط الرياضي',
  description: 'الحملة الانتخابية 2025 - اهداء من North Via Tech -- تورونتو - كندا  \n(647) 675-3343',
  openGraph: {
    title: 'ناجح البارودي - مرشح رئاسة مجلس ادارة نادي اسيوط الرياضي',
    description: 'الحملة الانتخابية 2025 - اهداء من North Via Tech -- تورونتو - كندا  \n(647) 675-3343',
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
    description: 'الحملة الانتخابية 2025 - اهداء من North Via Tech -- تورونتو - كندا  \n(647) 675-3343',
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
      <body>
        {children}
        <footer className="bg-black text-yellow-500 mt-12" dir="rtl">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
            <p className="font-semibold">
              الحملة الانتخابية 2025 - اهداء من North Via Tech -- تورونتو - كندا
            </p>
            <p className="mt-1">(647) 675-3343</p>
          </div>
        </footer>
      </body>
    </html>
  )
}


