import { Suspense } from 'react';
import { getMedia } from '@/server/actions/cms/media';
import { MediaClient } from '@/features/cms/components/media-client';
import workspace from '@/features/system/components/workspace.module.css';

export const metadata = {
  title: 'مكتبة الوسائط',
};

export default async function CmsMediaPage() {
  const result = await getMedia();

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
          <span className={workspace.eyebrow}>CMS & Media</span>
          <h1 className={workspace.title}>مكتبة الوسائط</h1>
          <p className={workspace.description}>
            رفع وإدارة الصور والملفات لاستخدامها في الأخبار والمقالات على الموقع.
          </p>
        </div>
      </div>

      <div className={workspace.surface}>
        <Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}}>جاري التحميل...</div>}>
          <MediaClient initialData={result.data} />
        </Suspense>
      </div>
    </div>
  );
}
