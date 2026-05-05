'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveCategory, deleteCategory } from '@/server/actions/cms/categories';
import styles from './cms.module.css';

interface CategoriesClientProps {
  initialData: any[];
}

export function CategoriesClient({ initialData }: CategoriesClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    if (editingCategory) {
      formData.append('id', editingCategory.id);
    }

    const res = await saveCategory(formData);

    if (res.success) {
      setActiveTab('list');
      setEditingCategory(null);
      router.refresh();
    } else {
      setError(res.error || 'حدث خطأ');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من الحذف النهائي؟ لا يمكن حذف تصنيف مرتبط بمقالات.')) {
      const res = await deleteCategory(id);
      if (res.success) router.refresh();
      else alert(res.error);
    }
  };

  const renderError = () => error && <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container} dir="rtl">
      
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'list' && !editingCategory ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('list'); setEditingCategory(null); setError(''); }}
        >
          قائمة التصنيفات
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'create' || editingCategory ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('create'); setEditingCategory(null); setError(''); }}
        >
          {editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
        </button>
      </div>

      <div className={styles.content}>
        {renderError()}

        {(activeTab === 'create' || editingCategory) && (
          <form onSubmit={handleSave} className={styles.form} style={{ maxWidth: '600px' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>اسم التصنيف <span className={styles.required}>*</span></label>
              <input
                type="text"
                name="name"
                defaultValue={editingCategory?.name || ''}
                className={styles.input}
                placeholder="مثال: كرة القدم"
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
                placeholder="e.g. football"
                defaultValue={editingCategory?.slug || ''}
                className={styles.input}
                required
                disabled={isSubmitting}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>يجب أن يكون بالإنجليزية وبدون مسافات</span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>وصف التصنيف (اختياري)</label>
              <textarea
                name="description"
                defaultValue={editingCategory?.description || ''}
                className={styles.input}
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>
                {isSubmitting ? 'جاري الحفظ...' : (editingCategory ? 'حفظ التعديلات' : 'إضافة التصنيف')}
              </button>
              {editingCategory && (
                <button
                  type="button"
                  className={styles.buttonSecondary}
                  onClick={() => { setEditingCategory(null); setActiveTab('list'); }}
                  disabled={isSubmitting}
                >
                  إلغاء
                </button>
              )}
            </div>
          </form>
        )}

        {activeTab === 'list' && !editingCategory && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>اسم التصنيف</th>
                  <th>الرابط (Slug)</th>
                  <th>تاريخ الإضافة</th>
                  <th style={{ width: '200px' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {initialData.map((category) => (
                  <tr key={category.id}>
                    <td style={{ fontWeight: 600 }}>{category.name}</td>
                    <td dir="ltr" style={{ color: '#64748b' }}>{category.slug}</td>
                    <td dir="ltr">{new Date(category.created_at).toISOString().split('T')[0]}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => { setEditingCategory(category); setActiveTab('create'); }}
                          className={styles.buttonSecondary}
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
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
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>لا توجد تصنيفات مسجلة</td>
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
