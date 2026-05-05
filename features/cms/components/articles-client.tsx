'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveArticle, toggleArticlePublish, deleteArticle } from '@/server/actions/cms/articles';
import styles from './cms.module.css';

interface ArticlesClientProps {
  initialData: any[];
}

export function ArticlesClient({ initialData }: ArticlesClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    if (editingArticle) {
      formData.append('id', editingArticle.id);
    }

    const res = await saveArticle(formData);

    if (res.success) {
      setActiveTab('list');
      setEditingArticle(null);
      router.refresh();
    } else {
      setError(res.error || 'حدث خطأ');
    }
    setIsSubmitting(false);
  };

  const handleTogglePublish = async (id: string, currentStatus: string) => {
    if (confirm(currentStatus === 'published' ? 'هل أنت متأكد من سحب النشر؟' : 'هل أنت متأكد من النشر على الموقع العام؟')) {
      const res = await toggleArticlePublish(id, currentStatus !== 'published');
      if (res.success) router.refresh();
      else alert(res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من الحذف النهائي؟')) {
      const res = await deleteArticle(id);
      if (res.success) router.refresh();
      else alert(res.error);
    }
  };

  const renderError = () => error && <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container} dir="rtl">
      
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'list' && !editingArticle ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('list'); setEditingArticle(null); setError(''); }}
        >
          قائمة المقالات
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'create' || editingArticle ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('create'); setEditingArticle(null); setError(''); }}
        >
          {editingArticle ? 'تعديل مقال' : 'كتابة مقال جديد'}
        </button>
      </div>

      <div className={styles.content}>
        {renderError()}

        {(activeTab === 'create' || editingArticle) && (
          <form onSubmit={handleSave} className={styles.form}>
            <div className={styles.grid2}>
              <div className={styles.formGroup}>
                <label className={styles.label}>عنوان المقال <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingArticle?.title || ''}
                  className={styles.input}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>الرابط المخصص (Slug) <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  name="slug"
                  dir="ltr"
                  placeholder="e.g. swimming-tournament-2026"
                  defaultValue={editingArticle?.slug || ''}
                  className={styles.input}
                  required
                  disabled={isSubmitting}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>يجب أن يكون بالإنجليزية وبدون مسافات</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>صورة الغلاف (رابط URL مؤقتاً)</label>
              <input
                type="text"
                name="coverImage"
                dir="ltr"
                defaultValue={editingArticle?.cover_image_url || ''}
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>مقتطف مختصر (يظهر في القوائم)</label>
              <textarea
                name="excerpt"
                defaultValue={editingArticle?.excerpt || ''}
                className={styles.input}
                rows={2}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>محتوى المقال <span className={styles.required}>*</span></label>
              <textarea
                name="content"
                defaultValue={editingArticle?.content || ''}
                className={styles.input}
                rows={12}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>
                {isSubmitting ? 'جاري الحفظ...' : (editingArticle ? 'حفظ التعديلات' : 'حفظ كمسودة')}
              </button>
              {editingArticle && (
                <button
                  type="button"
                  className={styles.buttonSecondary}
                  onClick={() => { setEditingArticle(null); setActiveTab('list'); }}
                  disabled={isSubmitting}
                >
                  إلغاء
                </button>
              )}
            </div>
          </form>
        )}

        {activeTab === 'list' && !editingArticle && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>العنوان</th>
                  <th>الحالة</th>
                  <th>تاريخ النشر</th>
                  <th>الكاتب</th>
                  <th style={{ width: '200px' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {initialData.map((article) => (
                  <tr key={article.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{article.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>/{article.slug}</div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${article.status === 'published' ? styles.badgeActive : styles.badgeDraft}`}>
                        {article.status === 'published' ? 'منشور' : 'مسودة'}
                      </span>
                    </td>
                    <td dir="ltr">{article.published_at ? new Date(article.published_at).toISOString().split('T')[0] : '-'}</td>
                    <td>{article.author?.raw_user_meta_data?.name || article.author?.email || '-'}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => handleTogglePublish(article.id, article.status)}
                          className={article.status === 'published' ? styles.buttonWarning : styles.buttonSuccess}
                        >
                          {article.status === 'published' ? 'سحب' : 'نشر'}
                        </button>
                        <button
                          onClick={() => { setEditingArticle(article); setActiveTab('create'); }}
                          className={styles.buttonSecondary}
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className={styles.buttonDanger}
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {initialData.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>لا توجد مقالات مسجلة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
