import { Suspense } from 'react';
import { getTrainingGroupsData } from '@/server/actions/sports/training-groups';
import { TrainingGroupsClient } from '@/features/sports/components/training-groups-client';
import workspace from '@/features/system/components/workspace.module.css';

export const metadata = {
  title: 'المجموعات التدريبية',
};

export default async function TrainingGroupsPage() {
  const result = await getTrainingGroupsData();

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
          <h1 className={workspace.title}>المجموعات التدريبية</h1>
          <p className={workspace.description}>
            إدارة الفرق التدريبية، تعيين المدربين، وجدولة الحصص في المنشآت الرياضية.
          </p>
        </div>
      </div>

      <Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}}>جاري التحميل...</div>}>
        <TrainingGroupsClient initialData={result.data as any} />
      </Suspense>
    </div>
  );
}
