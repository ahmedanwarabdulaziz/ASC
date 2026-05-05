import { Suspense } from 'react';
import { getAttendanceData } from '@/server/actions/sports/attendance';
import { AttendanceClient } from '@/features/sports/components/attendance-client';
import workspace from '@/features/system/components/workspace.module.css';

export const metadata = {
  title: 'حضور وانصراف التدريب',
};

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const currentDate = params.date || new Date().toISOString().substring(0, 10);
  const result = await getAttendanceData(currentDate);

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
          <span className={workspace.eyebrow}>Operations & Tracking</span>
          <h1 className={workspace.title}>سجل الحضور والانصراف</h1>
          <p className={workspace.description}>
            تسجيل حضور لاعبي المجموعات التدريبية يومياً وإغلاق الجلسات لحفظ سجلات الغياب التلقائي.
          </p>
        </div>
      </div>

      <div className={workspace.surface}>
        <Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}}>جاري التحميل...</div>}>
          <AttendanceClient initialData={result.data} currentDate={currentDate} />
        </Suspense>
      </div>
    </div>
  );
}
