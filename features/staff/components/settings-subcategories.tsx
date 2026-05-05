'use client';

import { useState } from 'react';
import { createStaffSubcategory, updateStaffSubcategory } from '@/server/actions/staff/settings';
import styles from './staff-settings.module.css';

export function SettingsSubcategories({ initialData, categories }: { initialData: any[], categories: any[] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (subcat: any) => {
    setIsEditing(true);
    setEditingId(subcat.id);
    setCategoryId(subcat.category_id);
    setName(subcat.name);
    setDescription(subcat.description || '');
    setIsActive(subcat.is_active);
    setError('');
  };

  const handleAddNew = () => {
    setIsEditing(true);
    setEditingId(null);
    setCategoryId('');
    setName('');
    setDescription('');
    setIsActive(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    let result;
    if (editingId) {
      result = await updateStaffSubcategory(editingId, { category_id: categoryId, name, description, is_active: isActive });
    } else {
      result = await createStaffSubcategory({ category_id: categoryId, name, description });
    }

    if (result.success) {
      setIsEditing(false);
    } else {
      setError(result.error || 'حدث خطأ أثناء الحفظ');
    }
    setIsSubmitting(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit}>
        <div className={styles.header}>
          <h3 className={styles.title}>{editingId ? 'تعديل فئة فرعية' : 'فئة فرعية جديدة'}</h3>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>القسم الرئيسي (الفئة)</label>
            <select className={styles.input} value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
              <option value="">اختر القسم</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>اسم الفئة الفرعية</label>
            <input type="text" className={styles.input} value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>الوصف (اختياري)</label>
            <input type="text" className={styles.input} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          {editingId && (
            <div className={styles.formGroup}>
              <label className={styles.label}>الحالة</label>
              <select className={styles.input} value={isActive ? 'true' : 'false'} onChange={e => setIsActive(e.target.value === 'true')}>
                <option value="true">نشطة</option>
                <option value="false">غير نشطة</option>
              </select>
            </div>
          )}
        </div>
        <div className={styles.formActions}>
          <button type="button" className={styles.buttonSecondary} onClick={() => setIsEditing(false)}>إلغاء</button>
          <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>{isSubmitting ? 'جاري الحفظ...' : 'حفظ'}</button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className={styles.header}>
        <h3 className={styles.title}>الفئات الفرعية للموظفين</h3>
        <button className={styles.buttonPrimary} onClick={handleAddNew}>إضافة فئة فرعية جديدة</button>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>القسم الرئيسي</th>
            <th>الاسم</th>
            <th>الوصف</th>
            <th>الحالة</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {initialData.map(sub => (
            <tr key={sub.id}>
              <td>{sub.category?.name || '-'}</td>
              <td>{sub.name}</td>
              <td>{sub.description || '-'}</td>
              <td>{sub.is_active ? 'نشطة' : 'غير نشطة'}</td>
              <td>
                <button className={styles.buttonSecondary} onClick={() => handleEdit(sub)}>تعديل</button>
              </td>
            </tr>
          ))}
          {initialData.length === 0 && (
            <tr><td colSpan={5} style={{ textAlign: 'center' }}>لا توجد فئات فرعية مسجلة</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
