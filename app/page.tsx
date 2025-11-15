import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Button from '@/components/Button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Navigation />
      <main>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-blue mb-6 text-center">
            مرحباً بكم في نظام إدارة انتخابات نادي ASC
          </h1>
          
          <div className="prose prose-lg max-w-none mb-8">
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              مرحباً، أنا [اسمك] وأنا مرشح لانتخابات نادي ASC. أقدم لكم هذا النظام البسيط 
              لإدارة فريق الانتخابات ومتابعة أعضائنا.
            </p>
            
            <p className="text-gray-700 text-lg leading-relaxed">
              يمكنكم من خلال هذا النظام:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-4">
              <li>عرض جميع أعضاء الفريق</li>
              <li>توزيع الأعضاء على الفرق</li>
              <li>متابعة حالة كل عضو</li>
              <li>إضافة ملاحظات ومعلومات مهمة</li>
            </ul>
          </div>

          <div className="mt-8 text-center">
            <Link href="/login" className="inline-block">
              <Button size="lg">
                تسجيل الدخول
              </Button>
            </Link>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}

