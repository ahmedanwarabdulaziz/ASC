'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPricingPlan, updatePricingPlan } from '@/server/actions/sports/pricing-plans';
import styles from './sports-settings.module.css';

interface PricingPlansClientProps {
  initialData: {
    plans: any[];
    sports: any[];
    sectors: any[];
    groups: any[];
  };
}

export function PricingPlansClient({ initialData }: PricingPlansClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filters for dropdowns
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');

  const renderError = () => error && <div className={styles.error}>{error}</div>;

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const res = await createPricingPlan(formData);
    if (res.success) {
      setEditingId(null);
      router.refresh();
    } else {
      setError(res.error || 'حدث خطأ');
    }
    setIsSubmitting(false);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const res = await updatePricingPlan(id, formData);
    if (res.success) {
      setEditingId(null);
      router.refresh();
    } else {
      setError(res.error || 'حدث خطأ');
    }
    setIsSubmitting(false);
  };

  return (
    <div className={styles.content} dir="rtl">
      <div className={styles.header}>
        <h2 className={styles.title}>خطط أسعار التدريب</h2>
        {!editingId && (
          <button className={styles.buttonPrimary} onClick={() => setEditingId('new')}>إضافة خطة جديدة</button>
        )}
      </div>
      {renderError()}

      {editingId === 'new' && (
        <form onSubmit={handleCreate} style={{marginBottom: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px'}}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>اسم الخطة (مثال: الخطة العادية)</label>
              <input type="text" name="name" className={styles.input} required disabled={isSubmitting} />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>اللعبة</label>
              <select 
                name="sportId" 
                className={styles.input} 
                disabled={isSubmitting}
                value={selectedSport}
                onChange={(e) => {
                  setSelectedSport(e.target.value);
                  setSelectedSector('');
                }}
              >
                <option value="">-- اختياري --</option>
                {initialData.sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>القطاع</label>
              <select 
                name="sectorId" 
                className={styles.input} 
                disabled={isSubmitting}
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
              >
                <option value="">-- اختياري --</option>
                {initialData.sectors
                  .filter(s => !selectedSport || s.sport_id === selectedSport)
                  .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
              <label className={styles.label}>المجموعات التدريبية المطبقة عليها الخطة</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1rem', maxHeight: '150px', overflowY: 'auto' }}>
                {initialData.groups
                  .filter(g => (!selectedSport || g.sport_id === selectedSport) && (!selectedSector || g.sector_id === selectedSector))
                  .map(g => (
                    <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input type="checkbox" name="trainingGroupIds" value={g.id} disabled={isSubmitting} />
                      <span>{g.name}</span>
                    </label>
                  ))}
                  {initialData.groups.filter(g => (!selectedSport || g.sport_id === selectedSport) && (!selectedSector || g.sector_id === selectedSector)).length === 0 && (
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>لا توجد مجموعات متطابقة مع التصفية الحالية</span>
                  )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>سعر العضو (شهرياً)</label>
              <input type="number" name="memberPrice" min="0" step="0.01" className={styles.input} required disabled={isSubmitting} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>سعر غير العضو (شهرياً)</label>
              <input type="number" name="nonMemberPrice" min="0" step="0.01" className={styles.input} required disabled={isSubmitting} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>عدد الحصص الأسبوعية</label>
              <input type="number" name="weeklySessionCount" min="1" className={styles.input} required disabled={isSubmitting} />
              <span style={{fontSize: '0.8rem', color: '#64748b', marginTop: '4px', display: 'block'}}>ستحسب الحصص الشهرية تلقائياً (×4)</span>
            </div>
          </div>
          <div className={styles.formActions} style={{marginTop: '1rem'}}>
            <button type="button" className={styles.buttonSecondary} onClick={() => setEditingId(null)} disabled={isSubmitting}>إلغاء</button>
            <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>حفظ وإضافة</button>
          </div>
        </form>
      )}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>الاسم</th>
            <th>النطاق (لعبة/قطاع/مجموعة)</th>
            <th>سعر العضو</th>
            <th>سعر غير العضو</th>
            <th>عدد الحصص</th>
            <th>الحالة</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {initialData.plans.map(p => {
            return (
              <tr key={p.id}>
                {editingId === p.id ? (
                  <td colSpan={7}>
                    <form onSubmit={(e) => handleUpdate(e, p.id)} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input type="text" name="name" defaultValue={p.name} className={styles.input} style={{width: '150px'}} required placeholder="الاسم" />
                      
                      <select name="sportId" defaultValue={p.sport_id || ''} className={styles.input}>
                        <option value="">-- كل الألعاب --</option>
                        {initialData.sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      
                      <select name="sectorId" defaultValue={p.sector_id || ''} className={styles.input}>
                        <option value="">-- كل القطاعات --</option>
                        {initialData.sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      
                      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                        <span style={{fontSize: '0.75rem', marginBottom: '2px'}}>المجموعات:</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '100px', overflowY: 'auto', border: '1px solid #cbd5e1', padding: '4px', background: '#fff' }}>
                          {initialData.groups.map(g => {
                            const isChecked = p.pricing_plan_training_groups?.some((ptg: any) => ptg.training_group_id === g.id);
                            return (
                              <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                                <input type="checkbox" name="trainingGroupIds" value={g.id} defaultChecked={isChecked} />
                                <span>{g.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      
                      <input type="number" name="memberPrice" defaultValue={p.member_price} className={styles.input} style={{width: '80px'}} required placeholder="العضو" />
                      <input type="number" name="nonMemberPrice" defaultValue={p.non_member_price} className={styles.input} style={{width: '80px'}} required placeholder="غير العضو" />
                      <input type="number" name="weeklySessionCount" defaultValue={p.weekly_session_count} className={styles.input} style={{width: '60px'}} required placeholder="أسبوعياً" />
                      
                      <select name="isActive" defaultValue={p.is_active ? 'true' : 'false'} className={styles.input} style={{width: '100px'}}>
                        <option value="true">نشط</option>
                        <option value="false">معطل</option>
                      </select>
                      
                      <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>حفظ</button>
                      <button type="button" className={styles.buttonSecondary} onClick={() => setEditingId(null)}>إلغاء</button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td style={{fontWeight: 600}}>{p.name}</td>
                    <td>
                      <div style={{fontSize: '0.85rem'}}>
                        {p.pricing_plan_training_groups && p.pricing_plan_training_groups.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {p.pricing_plan_training_groups.map((ptg: any) => (
                              <span key={ptg.training_group_id} style={{color: '#0369a1', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px'}}>
                                {ptg.training_groups?.name}
                              </span>
                            ))}
                          </div>
                        ) : p.sport_sectors ? (
                          <span style={{color: '#0f766e', background: '#ccfbf1', padding: '2px 6px', borderRadius: '4px'}}>قطاع: {p.sport_sectors.name}</span>
                        ) : p.sports ? (
                          <span style={{color: '#6d28d9', background: '#ede9fe', padding: '2px 6px', borderRadius: '4px'}}>لعبة: {p.sports.name}</span>
                        ) : (
                          <span style={{color: '#94a3b8'}}>عام</span>
                        )}
                      </div>
                    </td>
                    <td style={{color: '#16a34a', fontWeight: 'bold'}}>{p.member_price} ج.م</td>
                    <td style={{color: '#ea580c', fontWeight: 'bold'}}>{p.non_member_price} ج.م</td>
                    <td dir="ltr" style={{textAlign: 'right'}}>
                      {p.weekly_session_count} أسبوعياً<br/>
                      <span style={{fontSize: '0.75rem', color: '#64748b'}}>{p.monthly_billable_sessions} شهرياً</span>
                    </td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        background: p.is_active ? '#dcfce7' : '#fee2e2',
                        color: p.is_active ? '#166534' : '#991b1b',
                      }}>
                        {p.is_active ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td>
                      <button className={styles.buttonSecondary} onClick={() => setEditingId(p.id)}>تعديل</button>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
          {initialData.plans.length === 0 && (
            <tr><td colSpan={7} style={{textAlign: 'center', padding: '2rem'}}>لا توجد خطط أسعار حالياً</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
