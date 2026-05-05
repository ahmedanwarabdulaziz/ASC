'use client';

import { useState } from 'react';
import { createStaffGroup, updateStaffGroup } from '@/server/actions/staff/settings';
import styles from './staff-settings.module.css';

type RoleOption = {
  id: string;
  code: string;
  name_ar: string;
  name_en: string | null;
  is_active: boolean;
};

type StaffGroupRow = {
  id: string;
  name: string;
  description: string | null;
  role_id: string | null;
  is_active: boolean;
  role?: RoleOption | null;
};

type SettingsGroupsProps = {
  initialData: StaffGroupRow[];
  roleOptions: RoleOption[];
};

export function SettingsGroups({ initialData, roleOptions }: SettingsGroupsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (group: StaffGroupRow) => {
    setIsEditing(true);
    setEditingId(group.id);
    setName(group.name);
    setDescription(group.description || '');
    setRoleId(group.role_id || '');
    setIsActive(group.is_active);
    setError('');
  };

  const handleAddNew = () => {
    setIsEditing(true);
    setEditingId(null);
    setName('');
    setDescription('');
    setRoleId('');
    setIsActive(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const payload = {
      name,
      description,
      role_id: roleId || null,
    };

    const result = editingId
      ? await updateStaffGroup(editingId, { ...payload, is_active: isActive })
      : await createStaffGroup(payload);

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
          <h3 className={styles.title}>{editingId ? 'تعديل مجموعة' : 'مجموعة جديدة'}</h3>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.note}>
          اربط كل مجموعة بدور نظام واحد حتى تصبح المجموعة هي مصدر صلاحيات الوصول الفعلي.
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>اسم المجموعة</label>
            <input type="text" className={styles.input} value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>الوصف (اختياري)</label>
            <input type="text" className={styles.input} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>الدور المرتبط</label>
            <select className={styles.input} value={roleId} onChange={e => setRoleId(e.target.value)}>
              <option value="">بدون دور مرتبط</option>
              {roleOptions.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name_ar} ({role.code})
                </option>
              ))}
            </select>
            {roleOptions.length === 0 ? (
              <span className={styles.helpText}>
                لا توجد أدوار ظاهرة هنا حاليًا. تأكد أن المستخدم الحالي يملك صلاحية قراءة الأدوار.
              </span>
            ) : null}
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
          <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>
            {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className={styles.header}>
        <h3 className={styles.title}>مجموعات الصلاحيات</h3>
        <button className={styles.buttonPrimary} onClick={handleAddNew}>إضافة مجموعة جديدة</button>
      </div>
      <div className={styles.note}>
        الوظيفة تصف طبيعة العمل، أما المجموعة فتحدد ملف الوصول من خلال الدور المرتبط بها.
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>الاسم</th>
            <th>الوصف</th>
            <th>الدور المرتبط</th>
            <th>الحالة</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {initialData.map(group => (
            <tr key={group.id}>
              <td>{group.name}</td>
              <td>{group.description || '-'}</td>
              <td>
                {group.role ? (
                  <div className={styles.roleCell}>
                    <strong>{group.role.name_ar}</strong>
                    <span className={styles.codeBadge}>{group.role.code}</span>
                  </div>
                ) : (
                  <span className={styles.emptyState}>بدون دور مرتبط</span>
                )}
              </td>
              <td>{group.is_active ? 'نشطة' : 'غير نشطة'}</td>
              <td>
                <button className={styles.buttonSecondary} onClick={() => handleEdit(group)}>تعديل</button>
              </td>
            </tr>
          ))}
          {initialData.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center' }}>لا توجد مجموعات مسجلة</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
