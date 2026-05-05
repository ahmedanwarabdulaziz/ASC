'use client';

import { useState } from 'react';
import { createStaffJob, updateStaffJob } from '@/server/actions/staff/settings';
import styles from './staff-settings.module.css';

export function SettingsJobs({ initialData, categories, subcategories, groups }: { initialData: any[], categories: any[], subcategories: any[], groups: any[] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [defaultGroupId, setDefaultGroupId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isTrainingSector, setIsTrainingSector] = useState(false);
  const [isTrainingCommissionable, setIsTrainingCommissionable] = useState(false);
  const [accountPolicy, setAccountPolicy] = useState<'none' | 'optional' | 'required'>('none');
  const [isActive, setIsActive] = useState(true);
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (job: any) => {
    setIsEditing(true);
    setEditingId(job.id);
    setCategoryId(job.category_id);
    setSubcategoryId(job.subcategory_id || '');
    setDefaultGroupId(job.default_group_id || '');
    setName(job.name);
    setDescription(job.description || '');
    setIsTrainingSector(job.is_training_sector);
    setIsTrainingCommissionable(job.is_training_commissionable);
    setAccountPolicy(job.account_policy);
    setIsActive(job.is_active);
    setError('');
  };

  const handleAddNew = () => {
    setIsEditing(true);
    setEditingId(null);
    setCategoryId('');
    setSubcategoryId('');
    setDefaultGroupId('');
    setName('');
    setDescription('');
    setIsTrainingSector(false);
    setIsTrainingCommissionable(false);
    setAccountPolicy('none');
    setIsActive(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const payload = {
      category_id: categoryId,
      subcategory_id: subcategoryId || null,
      default_group_id: defaultGroupId || null,
      name,
      description,
      is_training_sector: isTrainingSector,
      is_training_commissionable: isTrainingCommissionable,
      account_policy: accountPolicy,
    };

    let result;
    if (editingId) {
      result = await updateStaffJob(editingId, { ...payload, is_active: isActive });
    } else {
      result = await createStaffJob(payload);
    }

    if (result.success) {
      setIsEditing(false);
    } else {
      setError(result.error || 'حدث خطأ أثناء الحفظ');
    }
    setIsSubmitting(false);
  };

  if (isEditing) {
    const availableSubcategories = subcategories.filter(s => s.category_id === categoryId);
    
    return (
      <form onSubmit={handleSubmit}>
        <div className={styles.header}>
          <h3 className={styles.title}>{editingId ? 'تعديل وظيفة' : 'وظيفة جديدة'}</h3>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>القسم (الفئة الرئيسية)</label>
            <select className={styles.input} value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
              <option value="">اختر القسم</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>الفئة الفرعية (اختياري)</label>
            <select className={styles.input} value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)}>
              <option value="">لا يوجد</option>
              {availableSubcategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>المسمى الوظيفي</label>
            <input type="text" className={styles.input} value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>الوصف (اختياري)</label>
            <input type="text" className={styles.input} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>مجموعة الصلاحيات الافتراضية</label>
            <select className={styles.input} value={defaultGroupId} onChange={e => setDefaultGroupId(e.target.value)} required>
              <option value="">اختر مجموعة الصلاحيات</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>سياسة الحساب</label>
            <select className={styles.input} value={accountPolicy} onChange={e => setAccountPolicy(e.target.value as any)} required>
              <option value="none">لا يحتاج حساب (None)</option>
              <option value="optional">اختياري (Optional)</option>
              <option value="required">مطلوب (Required)</option>
            </select>
          </div>

          <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" id="isTrainingSector" checked={isTrainingSector} onChange={e => setIsTrainingSector(e.target.checked)} />
            <label htmlFor="isTrainingSector" className={styles.label}>قطاع رياضي (تدريب)</label>
          </div>
          
          <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" id="isTrainingCommissionable" checked={isTrainingCommissionable} onChange={e => setIsTrainingCommissionable(e.target.checked)} disabled={!isTrainingSector} />
            <label htmlFor="isTrainingCommissionable" className={styles.label}>يستحق عمولة تدريب</label>
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
        <h3 className={styles.title}>الوظائف التشغيلية</h3>
        <button className={styles.buttonPrimary} onClick={handleAddNew}>إضافة وظيفة جديدة</button>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>الوظيفة</th>
            <th>القسم</th>
            <th>سياسة الحساب</th>
            <th>الحالة</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {initialData.map(job => (
            <tr key={job.id}>
              <td>{job.name}</td>
              <td>{job.category?.name || '-'} {job.subcategory ? `> ${job.subcategory.name}` : ''}</td>
              <td>{job.account_policy}</td>
              <td>{job.is_active ? 'نشطة' : 'غير نشطة'}</td>
              <td>
                <button className={styles.buttonSecondary} onClick={() => handleEdit(job)}>تعديل</button>
              </td>
            </tr>
          ))}
          {initialData.length === 0 && (
            <tr><td colSpan={5} style={{ textAlign: 'center' }}>لا توجد وظائف مسجلة</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
