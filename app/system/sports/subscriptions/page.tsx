import { Suspense } from 'react';
import { getSubscriptionsData } from '@/server/actions/sports/subscriptions';
import { SubscriptionsClient } from '@/features/sports/components/subscriptions-client';
import workspace from '@/features/system/components/workspace.module.css';

export const metadata = {
  title: 'الاشتراكات المالية',
};

export default async function SubscriptionsPage({ searchParams }: { searchParams: { month?: string } }) {
  const currentMonth = searchParams.month || new Date().toISOString().substring(0, 7);
  const result = await getSubscriptionsData(currentMonth);

  if (!result.success || !result.data) {
    return (
      <div className={workspace.page} dir="rtl">
        <div className={workspace.surface} style={{ margin: '2rem', padding: '2rem', borderLeft: '4px solid #ef4444' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>عذراً، تعذر تحميل البيانات</h2>
          <p style={{ fontSize: '1.1rem' }}>{result.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={workspace.page} dir="rtl">
      <div className={workspace.hero}>
        <div className={workspace.heroContent}>
          <span className={workspace.eyebrow}>Finance & Accounting</span>
          <h1 className={workspace.title}>الاشتراكات المالية لقطاع الرياضة</h1>
          <p className={workspace.description}>
            إصدار المطالبات الشهرية، تتبع المدفوعات، وتسجيل الإيصالات المالية للاعبين المشتركين.
          </p>
        </div>
      </div>

      <div className={workspace.surface}>
        <Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}}>جاري التحميل...</div>}>
          <SubscriptionsClient initialData={result.data} currentMonth={currentMonth} />
        </Suspense>
      </div>
    </div>
  );
}
