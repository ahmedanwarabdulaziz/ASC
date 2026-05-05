'use client';

import { useState } from 'react';
import { createStaffCategory, updateStaffCategory } from '@/server/actions/staff/settings';
import styles from './staff-settings.module.css';

export function SettingsCategories({ initialData }: { initialData: any[] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (category: any) => {
    setIsEditing(true);
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description || '');
    setIsActive(category.is_active);
    setError('');
  };

  const handleAddNew = () => {
    setIsEditing(true);
    setEditingId(null);
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
      result = await updateStaffCategory(editingId, { name, description, is_active: isActive });
    } else {
      result = await createStaffCategory({ name, description });
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
          <h3 className={styles.title}>{editingId ? 'تعديل قسم' : 'قسم جديد'}</h3>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>اسم القسم</label>
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
                <option value="true">نشط</option>
                <option value="false">غير نشط</option>
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
        <h3 className={styles.title}>أقسام الموظفين</h3>
        <button className={styles.buttonPrimary} onClick={handleAddNew}>إضافة قسم جديد</button>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>الاسم</th>
            <th>الوصف</th>
            <th>الحالة</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {initialData.map(cat => (
            <tr key={cat.id}>
              <td>{cat.name}</td>
              <td>{cat.description || '-'}</td>
              <td>{cat.is_active ? 'نشط' : 'غير نشط'}</td>
              <td>
                <button className={styles.buttonSecondary} onClick={() => handleEdit(cat)}>تعديل</button>
              </td>
            </tr>
          ))}
          {initialData.length === 0 && (
            <tr><td colSpan={4} style={{ textAlign: 'center' }}>لا توجد أقسام مسجلة</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
