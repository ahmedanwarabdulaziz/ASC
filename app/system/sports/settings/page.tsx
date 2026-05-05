import { Suspense } from 'react';
import Link from 'next/link';
import { getSportsCatalog } from '@/server/actions/sports/settings';
import { SportsSettingsClient } from '@/features/sports/components/sports-settings-client';
import workspace from '@/features/system/components/workspace.module.css';

export const metadata = {
  title: 'إعدادات الألعاب الرياضية',
};

export default async function SportsSettingsPage() {
  const result = await getSportsCatalog();

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
            <span className={workspace.eyebrow}>Settings & Configuration</span>
            <h1 className={workspace.title}>إعدادات الألعاب الرياضية</h1>
            <p className={workspace.description}>
              إدارة الألعاب، القطاعات، المستويات، والمراحل السنية للنادي.
            </p>
          </div>
        </div>
      </section>

      <section className={workspace.toolbar}>
        <div className={workspace.searchSlot}>
        </div>
        <div className={workspace.toolbarActions}>
        </div>
      </section>

      <section className={workspace.surface}>
        <Suspense fallback={<div style={{padding: '2rem'}}>جاري التحميل...</div>}>
          <SportsSettingsClient initialData={result.data} />
        </Suspense>
      </section>
    </div>
  );
}
