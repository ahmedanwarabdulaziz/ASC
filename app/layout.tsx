import type { Metadata } from 'next';
import './globals.css';
import GlobalBehavior from "@/components/GlobalBehavior";

export const metadata: Metadata = {
  title: 'Assiut SC | نادي أسيوط الرياضي',
  description: 'المنصة الرقمية المتكاملة لخدمة أعضاء النادي وإدارة العمليات',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <GlobalBehavior />
        {children}
      </body>
    </html>
  );
}
