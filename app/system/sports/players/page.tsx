import { Suspense } from 'react';
import { getPlayers } from '@/server/actions/sports/players';
import { PlayersClient } from '@/features/sports/components/players-client';
import workspace from '@/features/system/components/workspace.module.css';

export const metadata = {
  title: 'سجل اللاعبين',
};

export default async function PlayersPage() {
  const result = await getPlayers();

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
          <h1 className={workspace.title}>سجل اللاعبين</h1>
          <p className={workspace.description}>
            تسجيل وإدارة اللاعبين في مختلف الألعاب الرياضية وتحديد مستوياتهم.
          </p>
        </div>
      </div>

      <Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}}>جاري التحميل...</div>}>
        <PlayersClient initialData={result.data} />
      </Suspense>
    </div>
  );
}
