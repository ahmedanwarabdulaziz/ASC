import { Suspense } from 'react';
import { getArticles } from '@/server/actions/cms/articles';
import { ArticlesClient } from '@/features/cms/components/articles-client';
import workspace from '@/features/system/components/workspace.module.css';

export const metadata = {
  title: 'إدارة الأخبار والمقالات',
};

export default async function CmsArticlesPage() {
  const result = await getArticles();

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
          <h1 className={workspace.title}>الأخبار والمقالات</h1>
          <p className={workspace.description}>
            كتابة ونشر الأخبار، الإعلانات، وتغطية الفعاليات الرياضية للنادي على الموقع العام.
          </p>
        </div>
      </div>

      <div className={workspace.surface}>
        <Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}}>جاري التحميل...</div>}>
          <ArticlesClient initialData={result.data} />
        </Suspense>
      </div>
    </div>
  );
}
