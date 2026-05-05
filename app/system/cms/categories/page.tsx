import { Suspense } from 'react';
import { getCategories } from '@/server/actions/cms/categories';
import { CategoriesClient } from '@/features/cms/components/categories-client';
import workspace from '@/features/system/components/workspace.module.css';

export const metadata = {
  title: 'تصنيفات المحتوى',
};

export default async function CmsCategoriesPage() {
  const result = await getCategories();

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
          <span className={workspace.eyebrow}>CMS & Content</span>
          <h1 className={workspace.title}>التصنيفات</h1>
          <p className={workspace.description}>
            إدارة التصنيفات والتبويبات التي يتم استخدامها لترتيب وعرض الأخبار والمقالات على الموقع.
          </p>
        </div>
      </div>

      <div className={workspace.surface}>
        <Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}}>جاري التحميل...</div>}>
          <CategoriesClient initialData={result.data} />
        </Suspense>
      </div>
    </div>
  );
}
