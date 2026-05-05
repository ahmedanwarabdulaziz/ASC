import { Suspense } from 'react';
import { getFacilitiesCatalog } from '@/server/actions/facilities/settings';
import { FacilitiesSettingsClient } from '@/features/facilities/components/facilities-settings-client';
import workspace from '@/features/system/components/workspace.module.css';

export const metadata = {
  title: 'إعدادات المنشآت الرياضية',
};

export default async function FacilitiesSettingsPage() {
  const result = await getFacilitiesCatalog();

  if (!result.success || !result.data) {
    return (
      <div className={workspace.page} dir="rtl">
        <div className={workspace.surface} style={{ margin: '2rem', padding: '2rem', borderLeft: '4px solid #ef4444' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>عذراً، تعذر تحميل البيانات</h2>
          <p style={{ fontSize: '1.1rem' }}>{result.error}</p>
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
            <p style={{ fontWeight: 'bold' }}>ملاحظة فنية هامة:</p>
            <p>يحدث هذا الخطأ غالباً لأن جداول قاعدة البيانات الخاصة بالمنشآت (مثل <code>facility_sports</code>) غير موجودة.</p>
            <p>يرجى التأكد من تنفيذ الكود الموجود في ملف <code>20260504017_facilities_catalog.sql</code> داخل قاعدة بيانات Supabase.</p>
          </div>
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
            <h1 className={workspace.title}>إعدادات المنشآت الرياضية</h1>
            <p className={workspace.description}>
              إدارة المرافق الرئيسية للنادي مثل حمامات السباحة والملاعب، وتحديد الساحات الفرعية والسعات الاستيعابية.
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
          <FacilitiesSettingsClient initialData={result.data} />
        </Suspense>
      </section>
    </div>
  );
}
