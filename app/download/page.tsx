import Navigation from '@/components/Navigation';
import Link from 'next/link';

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-black" dir="rtl">
      <Navigation />
      <main className="container mx-auto px-4 py-10 text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">تحميل التطبيق</h1>
        <p className="text-gray-300 mb-8">
          يمكنك تثبيت التطبيق على هاتفك للحصول على وصول سريع وسهل من الشاشة الرئيسية.
        </p>

        <section className="bg-white/5 border border-yellow-500/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-3">التثبيت السريع (PWA)</h2>
          <p className="text-gray-300 mb-4">
            على معظم المتصفحات الحديثة، سيظهر لك خيار التثبيت تلقائياً. إذا لم يظهر، استخدم الزر "تحميل التطبيق" من القائمة.
          </p>
          <ul className="list-disc pr-6 text-gray-300 space-y-2">
            <li>على أندرويد (Chrome): من القائمة ⋮ اختر "إضافة إلى الشاشة الرئيسية".</li>
            <li>على iPhone (Safari): اضغط مشاركة ثم "أضف إلى الشاشة الرئيسية".</li>
            <li>على سطح المكتب: قد يظهر شريط "تثبيت التطبيق" في شريط العنوان.</li>
          </ul>
        </section>

        <section className="bg-white/5 border border-yellow-500/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-3">روابط التحميل (في حال توفرها)</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="#"
              className="px-6 py-3 rounded-lg bg-yellow-500 text-black font-bold hover:bg-yellow-600 transition-colors"
            >
              تنزيل Android (APK)
            </Link>
            <Link
              href="#"
              className="px-6 py-3 rounded-lg bg-white/10 text-white font-bold border border-white/20 hover:bg-white/20 transition-colors"
            >
              App Store (iOS)
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            ملاحظة: إذا لم تكن الروابط فعالة بعد، يمكنك استخدام طريقة التثبيت السريع أعلاه.
          </p>
        </section>
      </main>
    </div>
  );
}


