import { Suspense } from 'react';
import { getPricingPlansData } from '@/server/actions/sports/pricing-plans';
import { PricingPlansClient } from '@/features/sports/components/pricing-plans-client';
import workspace from '@/features/system/components/workspace.module.css';

export const metadata = {
  title: 'خطط أسعار التدريب',
};

export default async function PricingPlansPage() {
  const result = await getPricingPlansData();

  if (!result.success || !result.data) {
    return (
      <div className={workspace.page}>
        <div className={workspace.surface}>
          <h2>عذراً، حدث خطأ</h2>
          <p>{result.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={workspace.page} dir="rtl">
      <section className={workspace.hero}>
        <div className={workspace.heroRow}>
          <div>
            <span className={workspace.eyebrow}>Finance & Configuration</span>
            <h1 className={workspace.title}>خطط أسعار التدريب</h1>
            <p className={workspace.description}>
              إدارة خطط الأسعار للمجموعات التدريبية والألعاب الرياضية، وتحديد أسعار الأعضاء وغير الأعضاء.
            </p>
          </div>
        </div>
      </section>

      <section className={workspace.surface}>
        <Suspense fallback={<div style={{padding: '2rem'}}>جاري التحميل...</div>}>
          <PricingPlansClient initialData={result.data} />
        </Suspense>
      </section>
    </div>
  );
}
