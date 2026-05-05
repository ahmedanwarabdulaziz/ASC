'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  createFacility, 
  updateFacility, 
  createFacilityArea, 
  updateFacilityArea 
} from '@/server/actions/facilities/settings';
import { OperatingHoursManager } from './operating-hours-manager';
import styles from './facilities-settings.module.css';

interface FacilitiesSettingsClientProps {
  initialData: {
    facilities: any[];
    areas: any[];
    sports: any[];
  };
}

export function FacilitiesSettingsClient({ initialData }: FacilitiesSettingsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'facilities' | 'areas' | 'operating_hours'>('facilities');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Editing States
  const [editingId, setEditingId] = useState<string | null>(null);

  // States for filtering areas by facility
  const [newAreaFacilityId, setNewAreaFacilityId] = useState<string>('');
  const [editAreaFacilityId, setEditAreaFacilityId] = useState<string>('');
  const [listFacilityId, setListFacilityId] = useState<string>('');

  const renderError = () => error && <div className={styles.error}>{error}</div>;

  // =====================================
  // Facilities Tab
  // =====================================
  const renderFacilitiesTab = () => {
    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError('');
      const formData = new FormData(e.currentTarget);
      const res = await createFacility(formData);
      if (res.success) {
        setEditingId(null);
        router.refresh();
      } else {
        setError(res.error || 'خطأ');
      }
      setIsSubmitting(false);
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError('');
      const formData = new FormData(e.currentTarget);
      const res = await updateFacility(id, formData);
      if (res.success) {
        setEditingId(null);
        router.refresh();
      } else {
        setError(res.error || 'خطأ');
      }
      setIsSubmitting(false);
    };

    return (
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title}>المنشآت الرياضية الرئيسية</h2>
          {!editingId && (
            <button className={styles.buttonPrimary} onClick={() => setEditingId('new')}>إضافة منشأة</button>
          )}
        </div>
        {renderError()}

        {editingId === 'new' && (
          <form onSubmit={handleCreate} style={{marginBottom: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px'}}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>اسم المنشأة</label>
                <input type="text" name="name" className={styles.input} required placeholder="مثال: حمام السباحة الأولمبي" disabled={isSubmitting} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>نوع المنشأة</label>
                <select name="facilityType" className={styles.input} disabled={isSubmitting}>
                  <option value="pool">مسبح</option>
                  <option value="field">ملعب عشبي / ترابي</option>
                  <option value="court">ملعب صلب / ترتان</option>
                  <option value="hall">صالة مغطاة</option>
                  <option value="gym">صالة ألعاب بدنية</option>
                  <option value="track">مضمار</option>
                  <option value="room">غرفة / قاعة</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>الألعاب (اختياري، إذا كانت المنشأة مخصصة لألعاب معينة)</label>
                <div className={styles.input} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.75rem', background: 'transparent' }}>
                  {initialData.sports.map(s => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" name="sportIds" value={s.id} disabled={isSubmitting} />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>وصف (اختياري)</label>
                <input type="text" name="description" className={styles.input} disabled={isSubmitting} />
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.buttonSecondary} onClick={() => setEditingId(null)} disabled={isSubmitting}>إلغاء</button>
              <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>حفظ وإضافة</button>
            </div>
          </form>
        )}

        <table className={styles.table}>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>النوع</th>
              <th>الألعاب المرتبطة</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {initialData.facilities.map(f => {
              return (
                <tr key={f.id}>
                  {editingId === f.id ? (
                    <td colSpan={5}>
                      <form onSubmit={(e) => handleUpdate(e, f.id)} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input type="text" name="name" defaultValue={f.name} className={styles.input} required />
                        <select name="facilityType" defaultValue={f.facility_type} className={styles.input}>
                          <option value="pool">مسبح</option>
                          <option value="field">ملعب عشبي / ترابي</option>
                          <option value="court">ملعب صلب / ترتان</option>
                          <option value="hall">صالة مغطاة</option>
                          <option value="gym">صالة ألعاب بدنية</option>
                          <option value="track">مضمار</option>
                          <option value="room">غرفة / قاعة</option>
                          <option value="other">أخرى</option>
                        </select>
                        <div className={styles.input} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', maxHeight: '100px', overflowY: 'auto', padding: '0.2rem', minWidth: '150px', background: 'transparent' }}>
                          {initialData.sports.map(s => (
                            <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                              <input type="checkbox" name="sportIds" value={s.id} defaultChecked={f.facility_sports?.some((fs: any) => fs.sport_id === s.id)} />
                              {s.name}
                            </label>
                          ))}
                        </div>
                        <input type="text" name="description" defaultValue={f.description || ''} className={styles.input} placeholder="وصف" />
                        <select name="isActive" defaultValue={f.is_active ? 'true' : 'false'} className={styles.input} style={{width: '100px'}}>
                          <option value="true">نشط</option>
                          <option value="false">معطل</option>
                        </select>
                        <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>حفظ</button>
                        <button type="button" className={styles.buttonSecondary} onClick={() => setEditingId(null)}>إلغاء</button>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td style={{fontWeight: 600}}>{f.name}</td>
                      <td>
                        {f.facility_type === 'pool' && 'مسبح'}
                        {f.facility_type === 'field' && 'ملعب عشبي/ترابي'}
                        {f.facility_type === 'court' && 'ملعب صلب/ترتان'}
                        {f.facility_type === 'hall' && 'صالة مغطاة'}
                        {f.facility_type === 'gym' && 'صالة بدنية'}
                        {f.facility_type === 'track' && 'مضمار'}
                        {f.facility_type === 'room' && 'غرفة/قاعة'}
                        {f.facility_type === 'other' && 'أخرى'}
                      </td>
                      <td>
                        {f.facility_sports && f.facility_sports.length > 0 
                          ? f.facility_sports.map((fs: any) => initialData.sports.find(s => s.id === fs.sport_id)?.name).filter(Boolean).join('، ')
                          : <span style={{color: '#94a3b8'}}>عام (الكل)</span>}
                      </td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          background: f.is_active ? '#dcfce7' : '#fee2e2',
                          color: f.is_active ? '#166534' : '#991b1b',
                        }}>
                          {f.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td>
                        <button className={styles.buttonSecondary} onClick={() => setEditingId(f.id)}>تعديل</button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            {initialData.facilities.length === 0 && (
              <tr><td colSpan={5} style={{textAlign: 'center', padding: '2rem'}}>لا توجد منشآت حالياً</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // =====================================
  // Facility Areas Tab
  // =====================================
  const renderAreasTab = () => {
    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError('');
      const formData = new FormData(e.currentTarget);
      const res = await createFacilityArea(formData);
      if (res.success) {
        setEditingId(null);
        router.refresh();
      } else {
        setError(res.error || 'خطأ');
      }
      setIsSubmitting(false);
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError('');
      const formData = new FormData(e.currentTarget);
      const res = await updateFacilityArea(id, formData);
      if (res.success) {
        setEditingId(null);
        router.refresh();
      } else {
        setError(res.error || 'خطأ');
      }
      setIsSubmitting(false);
    };

    // Derived filtering logic for the list view
    const filteredAreas = listFacilityId 
      ? initialData.areas.filter(a => a.facility_id === listFacilityId) 
      : initialData.areas;

    return (
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title}>الساحات والملاعب الفرعية</h2>
          {!editingId && (
            <button className={styles.buttonPrimary} onClick={() => setEditingId('new')}>إضافة ساحة</button>
          )}
        </div>
        
        {!editingId && (
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>تصفية حسب المنشأة:</span>
            <select 
              className={styles.input} 
              style={{ width: 'auto', minWidth: '200px' }}
              value={listFacilityId}
              onChange={(e) => setListFacilityId(e.target.value)}
            >
              <option value="">الكل</option>
              {initialData.facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        )}

        {renderError()}

        {editingId === 'new' && (
          <form onSubmit={handleCreate} style={{marginBottom: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px'}}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>المنشأة الرئيسية</label>
                <select 
                  name="facilityId" 
                  className={styles.input} 
                  required 
                  disabled={isSubmitting}
                  value={newAreaFacilityId || (initialData.facilities[0]?.id || '')}
                  onChange={(e) => setNewAreaFacilityId(e.target.value)}
                >
                  {initialData.facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>اسم الساحة / الترقيم (مثال: حارة 1، ملعب أ)</label>
                <input type="text" name="name" className={styles.input} required disabled={isSubmitting} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>نوع الساحة</label>
                <select name="areaType" className={styles.input} disabled={isSubmitting}>
                  <option value="lane">حارة</option>
                  <option value="square">مربع / قطاع صغير</option>
                  <option value="court">ملعب فردي</option>
                  <option value="field_zone">جزء من ملعب</option>
                  <option value="room">غرفة / قاعة</option>
                  <option value="full_facility">كامل المنشأة</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>السعة الاستيعابية (أفراد) اختياري</label>
                <input type="number" name="capacity" min="1" className={styles.input} disabled={isSubmitting} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>الترتيب (1, 2, 3..)</label>
                <input type="number" name="sortOrder" min="0" defaultValue={0} className={styles.input} required disabled={isSubmitting} />
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.buttonSecondary} onClick={() => setEditingId(null)} disabled={isSubmitting}>إلغاء</button>
              <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>حفظ وإضافة</button>
            </div>
          </form>
        )}

        <table className={styles.table}>
          <thead>
            <tr>
              <th>المنشأة الرئيسية</th>
              <th>الترتيب</th>
              <th>اسم الساحة</th>
              <th>النوع</th>
              <th>السعة</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredAreas.map(a => {
              const facility = initialData.facilities.find(f => f.id === a.facility_id);
              return (
                <tr key={a.id}>
                  {editingId === a.id ? (
                    <td colSpan={7}>
                      <form onSubmit={(e) => handleUpdate(e, a.id)} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select 
                          name="facilityId" 
                          value={editAreaFacilityId || a.facility_id} 
                          onChange={(e) => setEditAreaFacilityId(e.target.value)}
                          className={styles.input} 
                          required
                        >
                          {initialData.facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                        <input type="number" name="sortOrder" defaultValue={a.sort_order} className={styles.input} style={{width: '60px'}} required />
                        <input type="text" name="name" defaultValue={a.name} className={styles.input} required />
                        <select name="areaType" defaultValue={a.area_type} className={styles.input}>
                          <option value="lane">حارة</option>
                          <option value="square">مربع / قطاع</option>
                          <option value="court">ملعب فردي</option>
                          <option value="field_zone">جزء من ملعب</option>
                          <option value="room">غرفة / قاعة</option>
                          <option value="full_facility">كامل المنشأة</option>
                          <option value="other">أخرى</option>
                        </select>
                        <input type="number" name="capacity" defaultValue={a.capacity || ''} className={styles.input} placeholder="سعة" style={{width: '80px'}} />
                        <select name="isActive" defaultValue={a.is_active ? 'true' : 'false'} className={styles.input} style={{width: '80px'}}>
                          <option value="true">نشط</option>
                          <option value="false">معطل</option>
                        </select>
                        <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>حفظ</button>
                        <button type="button" className={styles.buttonSecondary} onClick={() => setEditingId(null)}>إلغاء</button>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td>{facility?.name || '-'}</td>
                      <td style={{fontWeight: 600}}>{a.sort_order}</td>
                      <td style={{fontWeight: 600}}>{a.name}</td>
                      <td>
                        {a.area_type === 'lane' && 'حارة'}
                        {a.area_type === 'square' && 'مربع/قطاع'}
                        {a.area_type === 'court' && 'ملعب فردي'}
                        {a.area_type === 'field_zone' && 'جزء من ملعب'}
                        {a.area_type === 'room' && 'غرفة/قاعة'}
                        {a.area_type === 'full_facility' && 'كامل المنشأة'}
                        {a.area_type === 'other' && 'أخرى'}
                      </td>
                      <td>{a.capacity ? `${a.capacity} فرد` : <span style={{color: '#94a3b8'}}>-</span>}</td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          background: a.is_active ? '#dcfce7' : '#fee2e2',
                          color: a.is_active ? '#166534' : '#991b1b',
                        }}>
                          {a.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td>
                        <button className={styles.buttonSecondary} onClick={() => {
                          setEditingId(a.id);
                          setEditAreaFacilityId(a.facility_id);
                        }}>تعديل</button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            {filteredAreas.length === 0 && (
              <tr><td colSpan={7} style={{textAlign: 'center', padding: '2rem'}}>لا توجد ساحات فرعية</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={styles.container} dir="rtl">
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'facilities' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('facilities')}
          >
            إدارة المنشآت
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'areas' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('areas')}
          >
            تقسيمات الساحات / الحارات
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'operating_hours' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('operating_hours')}
          >
            مواعيد التشغيل والصيانة
          </button>
        </div>

      {activeTab === 'facilities' && renderFacilitiesTab()}
      {activeTab === 'areas' && renderAreasTab()}
      {activeTab === 'operating_hours' && <OperatingHoursManager facilities={initialData.facilities} />}
    </div>
  );
}
