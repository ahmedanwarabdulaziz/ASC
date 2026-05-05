'use client';

import { useState, useEffect } from 'react';
import { getFacilityOperatingHours, addOperatingHours, removeOperatingHours, addOperatingException, removeOperatingException } from '@/server/actions/facilities/operating-hours';
import styles from './facilities-settings.module.css';

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const STATUSES = [
  { value: 'available', label: 'متاح' },
  { value: 'maintenance', label: 'صيانة' },
  { value: 'closed', label: 'مغلق' }
];

export function OperatingHoursManager({ facilities }: { facilities: any[] }) {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [hours, setHours] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedFacilityId) {
      loadData();
    } else {
      setHours([]);
      setExceptions([]);
    }
  }, [selectedFacilityId]);

  const loadData = async () => {
    setIsLoading(true);
    const res = await getFacilityOperatingHours(selectedFacilityId);
    if (res.success && res.data) {
      setHours(res.data.hours);
      setExceptions(res.data.exceptions);
    }
    setIsLoading(false);
  };

  const handleAddHours = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFacilityId) return;
    
    setIsSubmitting(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const dayOfWeekStr = formData.get('dayOfWeek') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const status = formData.get('status') as string;

    const daysToApply = dayOfWeekStr === 'all' ? [0, 1, 2, 3, 4, 5, 6] : [parseInt(dayOfWeekStr, 10)];

    let hasError = false;
    for (const day of daysToApply) {
      const res = await addOperatingHours(selectedFacilityId, day, startTime, endTime, status);
      if (!res.success) {
        hasError = true;
        setError(res.error || 'حدث خطأ');
        break;
      }
    }

    if (!hasError) {
      (e.target as HTMLFormElement).reset();
      await loadData();
    }
    setIsSubmitting(false);
  };

  const handleRemoveHours = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموعد؟')) return;
    setIsSubmitting(true);
    const res = await removeOperatingHours(id);
    if (res.success) {
      await loadData();
    } else {
      setError(res.error || 'خطأ');
    }
    setIsSubmitting(false);
  };

  const handleAddException = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFacilityId) return;
    
    setIsSubmitting(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    formData.append('facilityId', selectedFacilityId);

    const res = await addOperatingException(formData);
    if (res.success) {
      (e.target as HTMLFormElement).reset();
      await loadData();
    } else {
      setError(res.error || 'خطأ');
    }
    setIsSubmitting(false);
  };

  const handleRemoveException = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا الاستثناء؟')) return;
    setIsSubmitting(true);
    const res = await removeOperatingException(id);
    if (res.success) {
      await loadData();
    } else {
      setError(res.error || 'خطأ');
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <label className={styles.label} style={{display: 'block', marginBottom: '0.5rem'}}>المنشأة</label>
        <select 
          className={styles.input} 
          value={selectedFacilityId}
          onChange={(e) => setSelectedFacilityId(e.target.value)}
          style={{ maxWidth: '400px' }}
        >
          <option value="">-- اختر المنشأة لإدارة أوقات العمل --</option>
          {facilities.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {selectedFacilityId && !isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* Regular Hours Section */}
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>مواعيد التشغيل الأساسية</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              أي وقت لا يتم إضافته كـ "متاح" هنا، سيعتبره النظام <strong>مغلقاً</strong> ولن يقبل الحجز.
            </p>

            <form onSubmit={handleAddHours} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>اليوم</label>
                  <select name="dayOfWeek" className={styles.input} required disabled={isSubmitting}>
                    <option value="">-- اختر --</option>
                    <option value="all">تطبيق على جميع أيام الأسبوع (أيام العمل)</option>
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>من الساعة</label>
                  <input type="time" name="startTime" className={styles.input} required disabled={isSubmitting} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>إلى الساعة</label>
                  <input type="time" name="endTime" className={styles.input} required disabled={isSubmitting} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>الحالة</label>
                  <select name="status" className={styles.input} required disabled={isSubmitting}>
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>إضافة فترة زمنية</button>
              </div>
            </form>

            {hours.length > 0 ? (
              <table className={styles.table} style={{ fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th>اليوم</th>
                    <th>من</th>
                    <th>إلى</th>
                    <th>الحالة</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {hours.map(h => (
                    <tr key={h.id}>
                      <td>{DAYS[h.day_of_week]}</td>
                      <td>{h.start_time.substring(0,5)}</td>
                      <td>{h.end_time.substring(0,5)}</td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem',
                          background: h.status === 'available' ? '#dcfce7' : h.status === 'maintenance' ? '#fef08a' : '#fee2e2',
                          color: h.status === 'available' ? '#166534' : h.status === 'maintenance' ? '#854d0e' : '#991b1b'
                        }}>
                          {STATUSES.find(s => s.value === h.status)?.label}
                        </span>
                      </td>
                      <td>
                        <button type="button" onClick={() => handleRemoveHours(h.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', color: '#94a3b8' }}>لا توجد مواعيد مسجلة (المنشأة مغلقة دائماً).</p>
            )}
          </div>

          {/* Exceptions Section */}
          <div style={{ background: '#fff5f5', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <h3 style={{ marginBottom: '1rem', color: '#991b1b' }}>مواعيد الغلق الاستثنائية</h3>
            <p style={{ fontSize: '0.85rem', color: '#b91c1c', marginBottom: '1rem' }}>
              لإضافة أعطال مفاجئة أو أيام محددة للتوقف تكسر القاعدة الأساسية (مثل إغلاق الثلاثاء 15 مايو).
            </p>

            <form onSubmit={handleAddException} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>التاريخ</label>
                  <input type="date" name="exceptionDate" className={styles.input} required disabled={isSubmitting} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>من الساعة</label>
                  <input type="time" name="startTime" className={styles.input} required disabled={isSubmitting} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>إلى الساعة</label>
                  <input type="time" name="endTime" className={styles.input} required disabled={isSubmitting} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>الحالة</label>
                  <select name="status" className={styles.input} required disabled={isSubmitting}>
                    <option value="closed">مغلق (إغلاق مفاجئ)</option>
                    <option value="maintenance">صيانة استثنائية</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={styles.label}>ملاحظات (السبب)</label>
                <input type="text" name="notes" className={styles.input} disabled={isSubmitting} placeholder="مثال: صيانة طارئة للمضخات" />
              </div>
              <div>
                <button type="submit" className={styles.buttonPrimary} style={{ background: '#dc2626' }} disabled={isSubmitting}>إضافة استثناء</button>
              </div>
            </form>

            {exceptions.length > 0 ? (
              <table className={styles.table} style={{ fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الوقت</th>
                    <th>الحالة</th>
                    <th>السبب</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptions.map(e => (
                    <tr key={e.id}>
                      <td>{new Date(e.exception_date).toLocaleDateString('ar-EG')}</td>
                      <td>{e.start_time.substring(0,5)} - {e.end_time.substring(0,5)}</td>
                      <td>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', background: '#fee2e2', color: '#991b1b' }}>
                          {STATUSES.find(s => s.value === e.status)?.label}
                        </span>
                      </td>
                      <td>{e.notes}</td>
                      <td>
                        <button type="button" onClick={() => handleRemoveException(e.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', color: '#fca5a5' }}>لا توجد استثناءات مسجلة.</p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
