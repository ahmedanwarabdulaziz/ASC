'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  createSport, 
  updateSport, 
  updateSectorSettings, 
  createSportLevel, 
  updateSportLevel, 
  createAgeGroup, 
  updateAgeGroup 
} from '@/server/actions/sports/settings';
import styles from './sports-settings.module.css';

interface SportsSettingsClientProps {
  initialData: {
    sports: any[];
    sectors: any[];
    levels: any[];
    ageGroups: any[];
  };
}

export function SportsSettingsClient({ initialData }: SportsSettingsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'sports' | 'sectors' | 'levels' | 'ageGroups'>('sports');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Editing States
  const [editingId, setEditingId] = useState<string | null>(null);

  // Age Groups specific states for filtering sectors by selected sport
  const [newAgeGroupSportId, setNewAgeGroupSportId] = useState<string>('');
  const [editAgeGroupSportId, setEditAgeGroupSportId] = useState<string>('');

  const renderError = () => error && <div className={styles.error}>{error}</div>;

  // =====================================
  // Sports Tab
  // =====================================
  const renderSportsTab = () => {
    const handleCreateSport = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError('');
      const formData = new FormData(e.currentTarget);
      const res = await createSport(formData);
      if (res.success) {
        setEditingId(null);
        router.refresh();
      } else {
        setError(res.error || 'خطأ');
      }
      setIsSubmitting(false);
    };

    const handleUpdateSport = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError('');
      const formData = new FormData(e.currentTarget);
      const res = await updateSport(id, formData);
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
          <h2 className={styles.title}>الألعاب الرياضية</h2>
          {!editingId && (
            <button className={styles.buttonPrimary} onClick={() => setEditingId('new')}>إضافة لعبة جديدة</button>
          )}
        </div>
        {renderError()}

        {editingId === 'new' && (
          <form onSubmit={handleCreateSport} style={{marginBottom: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px'}}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>اسم اللعبة</label>
                <input type="text" name="name" className={styles.input} required placeholder="مثال: سباحة" disabled={isSubmitting} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>وصف (اختياري)</label>
                <input type="text" name="description" className={styles.input} disabled={isSubmitting} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>نظام التصنيف بقطاع الممارسة</label>
                <select name="practiceMode" className={styles.input} disabled={isSubmitting}>
                  <option value="level_only">بالمستوى فقط</option>
                  <option value="age_only">بالمرحلة السنية فقط</option>
                  <option value="age_and_level">بالمستوى والمرحلة السنية</option>
                  <option value="manual">يدوي (بدون قيود)</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>نظام التصنيف بقطاع البطولة</label>
                <select name="competitionMode" className={styles.input} disabled={isSubmitting}>
                  <option value="age_and_level">بالمستوى والمرحلة السنية</option>
                  <option value="age_only">بالمرحلة السنية فقط</option>
                  <option value="level_only">بالمستوى فقط</option>
                  <option value="manual">يدوي (بدون قيود)</option>
                </select>
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
              <th>الوصف</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {initialData.sports.map(s => (
              <tr key={s.id}>
                {editingId === s.id ? (
                  <td colSpan={4}>
                    <form onSubmit={(e) => handleUpdateSport(e, s.id)} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <input type="text" name="name" defaultValue={s.name} className={styles.input} required />
                      <input type="text" name="description" defaultValue={s.description || ''} className={styles.input} />
                      <select name="isActive" defaultValue={s.is_active ? 'true' : 'false'} className={styles.input}>
                        <option value="true">نشط</option>
                        <option value="false">معطل</option>
                      </select>
                      <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>حفظ</button>
                      <button type="button" className={styles.buttonSecondary} onClick={() => setEditingId(null)}>إلغاء</button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td style={{fontWeight: 600}}>{s.name}</td>
                    <td>{s.description || '-'}</td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        background: s.is_active ? '#dcfce7' : '#fee2e2',
                        color: s.is_active ? '#166534' : '#991b1b',
                      }}>
                        {s.is_active ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td>
                      <button className={styles.buttonSecondary} onClick={() => setEditingId(s.id)}>تعديل</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {initialData.sports.length === 0 && (
              <tr><td colSpan={4} style={{textAlign: 'center', padding: '2rem'}}>لا توجد ألعاب حالياً</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // =====================================
  // Sectors Tab
  // =====================================
  const renderSectorsTab = () => {
    const handleUpdateSettings = async (sectorId: string, classificationMode: string, requiresMedicalApproval: boolean) => {
      setError('');
      setIsSubmitting(true);
      const res = await updateSectorSettings(sectorId, classificationMode, requiresMedicalApproval);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || 'خطأ');
      }
      setIsSubmitting(false);
    };

    return (
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title}>إعدادات القطاعات (الممارسة والبطولة)</h2>
        </div>
        {renderError()}
        <p style={{marginBottom: '1.5rem', color: '#64748b'}}>يتم إنشاء القطاعات تلقائياً عند إضافة كل لعبة. من هنا يمكنك التحكم في كيفية تصنيف اللاعبين داخل كل قطاع.</p>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>اللعبة</th>
              <th>القطاع</th>
              <th>نظام التصنيف</th>
              <th>يتطلب موافقة طبية؟</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {initialData.sectors.map(sec => {
              const sport = initialData.sports.find(s => s.id === sec.sport_id);
              return (
                <tr key={sec.id}>
                  <td style={{fontWeight: 600}}>{sport?.name || '-'}</td>
                  <td>{sec.name}</td>
                  <td>
                    <select 
                      defaultValue={sec.classification_mode} 
                      onChange={(e) => handleUpdateSettings(sec.id, e.target.value, sec.requires_medical_approval)}
                      className={styles.input}
                      disabled={isSubmitting}
                      style={{ maxWidth: '250px' }}
                    >
                      <option value="level_only">بالمستوى فقط</option>
                      <option value="age_only">بالمرحلة السنية فقط</option>
                      <option value="age_and_level">بالمستوى والمرحلة السنية</option>
                      <option value="manual">يدوي (بدون قيود)</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      defaultValue={sec.requires_medical_approval ? 'true' : 'false'} 
                      onChange={(e) => handleUpdateSettings(sec.id, sec.classification_mode, e.target.value === 'true')}
                      className={styles.input}
                      disabled={isSubmitting}
                      style={{ maxWidth: '120px' }}
                    >
                      <option value="true">نعم</option>
                      <option value="false">لا</option>
                    </select>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      background: sec.is_active ? '#dcfce7' : '#fee2e2',
                      color: sec.is_active ? '#166534' : '#991b1b',
                    }}>
                      {sec.is_active ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // =====================================
  // Levels Tab
  // =====================================
  const renderLevelsTab = () => {
    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError('');
      const formData = new FormData(e.currentTarget);
      const res = await createSportLevel(formData);
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
      const res = await updateSportLevel(id, formData);
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
          <h2 className={styles.title}>المستويات</h2>
          {!editingId && (
            <button className={styles.buttonPrimary} onClick={() => setEditingId('new')}>إضافة مستوى</button>
          )}
        </div>
        {renderError()}

        {editingId === 'new' && (
          <form onSubmit={handleCreate} style={{marginBottom: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px'}}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>اللعبة</label>
                <select name="sportId" className={styles.input} required disabled={isSubmitting}>
                  {initialData.sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>الرمز (مثال: A)</label>
                <input type="text" name="code" className={styles.input} required disabled={isSubmitting} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>الاسم (مثال: مستوى مبتدئ)</label>
                <input type="text" name="name" className={styles.input} required disabled={isSubmitting} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>الترتيب المنطقي (1, 2, 3..)</label>
                <input type="number" name="sortOrder" min="1" className={styles.input} required disabled={isSubmitting} />
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
              <th>اللعبة</th>
              <th>الترتيب</th>
              <th>الرمز</th>
              <th>الاسم</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {initialData.levels.map(l => {
              const sport = initialData.sports.find(s => s.id === l.sport_id);
              return (
                <tr key={l.id}>
                  {editingId === l.id ? (
                    <td colSpan={6}>
                      <form onSubmit={(e) => handleUpdate(e, l.id)} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select name="sportId" defaultValue={l.sport_id} className={styles.input} required>
                          {initialData.sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <input type="number" name="sortOrder" defaultValue={l.sort_order} className={styles.input} style={{width: '80px'}} required />
                        <input type="text" name="code" defaultValue={l.code} className={styles.input} style={{width: '100px'}} required />
                        <input type="text" name="name" defaultValue={l.name} className={styles.input} required />
                        <select name="isActive" defaultValue={l.is_active ? 'true' : 'false'} className={styles.input} style={{width: '100px'}}>
                          <option value="true">نشط</option>
                          <option value="false">معطل</option>
                        </select>
                        <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>حفظ</button>
                        <button type="button" className={styles.buttonSecondary} onClick={() => setEditingId(null)}>إلغاء</button>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td>{sport?.name || '-'}</td>
                      <td style={{fontWeight: 600}}>{l.sort_order}</td>
                      <td>{l.code}</td>
                      <td>{l.name}</td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          background: l.is_active ? '#dcfce7' : '#fee2e2',
                          color: l.is_active ? '#166534' : '#991b1b',
                        }}>
                          {l.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td>
                        <button className={styles.buttonSecondary} onClick={() => setEditingId(l.id)}>تعديل</button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // =====================================
  // Age Groups Tab
  // =====================================
  const renderAgeGroupsTab = () => {
    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError('');
      const formData = new FormData(e.currentTarget);
      const res = await createAgeGroup(formData);
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
      const res = await updateAgeGroup(id, formData);
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
          <h2 className={styles.title}>المراحل السنية</h2>
          {!editingId && (
            <button className={styles.buttonPrimary} onClick={() => setEditingId('new')}>إضافة مرحلة</button>
          )}
        </div>
        {renderError()}

        {editingId === 'new' && (
          <form onSubmit={handleCreate} style={{marginBottom: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px'}}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>اللعبة</label>
                <select 
                  name="sportId" 
                  className={styles.input} 
                  required 
                  disabled={isSubmitting}
                  value={newAgeGroupSportId || (initialData.sports[0]?.id || '')}
                  onChange={(e) => setNewAgeGroupSportId(e.target.value)}
                >
                  {initialData.sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>القطاع (اختياري)</label>
                <select name="sectorId" className={styles.input} disabled={isSubmitting}>
                  <option value="">عام (على كل القطاعات)</option>
                  {initialData.sectors
                    .filter(s => s.sport_id === (newAgeGroupSportId || initialData.sports[0]?.id))
                    .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>الاسم (مثال: تحت 12 سنة)</label>
                <input type="text" name="name" className={styles.input} required disabled={isSubmitting} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>الحد الأدنى للعمر (اختياري)</label>
                <input type="number" name="minAgeYears" min="0" className={styles.input} disabled={isSubmitting} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>الحد الأقصى للعمر (اختياري)</label>
                <input type="number" name="maxAgeYears" min="0" className={styles.input} disabled={isSubmitting} />
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
              <th>اللعبة</th>
              <th>القطاع</th>
              <th>الاسم</th>
              <th>العمر (أدنى - أقصى)</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {initialData.ageGroups.map(ag => {
              const sport = initialData.sports.find(s => s.id === ag.sport_id);
              const sector = initialData.sectors.find(s => s.id === ag.sector_id);
              return (
                <tr key={ag.id}>
                  {editingId === ag.id ? (
                    <td colSpan={6}>
                      <form onSubmit={(e) => handleUpdate(e, ag.id)} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select 
                          name="sportId" 
                          value={editAgeGroupSportId || ag.sport_id} 
                          onChange={(e) => setEditAgeGroupSportId(e.target.value)}
                          className={styles.input} 
                          required
                        >
                          {initialData.sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select name="sectorId" defaultValue={ag.sector_id || ''} className={styles.input}>
                          <option value="">عام</option>
                          {initialData.sectors
                            .filter(s => s.sport_id === (editAgeGroupSportId || ag.sport_id))
                            .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <input type="text" name="name" defaultValue={ag.name} className={styles.input} required />
                        <input type="number" name="minAgeYears" defaultValue={ag.min_age_years ?? ''} className={styles.input} placeholder="أدنى" style={{width: '80px'}} />
                        <input type="number" name="maxAgeYears" defaultValue={ag.max_age_years ?? ''} className={styles.input} placeholder="أقصى" style={{width: '80px'}} />
                        <select name="isActive" defaultValue={ag.is_active ? 'true' : 'false'} className={styles.input} style={{width: '100px'}}>
                          <option value="true">نشط</option>
                          <option value="false">معطل</option>
                        </select>
                        <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>حفظ</button>
                        <button type="button" className={styles.buttonSecondary} onClick={() => setEditingId(null)}>إلغاء</button>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td>{sport?.name || '-'}</td>
                      <td>{sector ? sector.name : <span style={{color: '#94a3b8'}}>عام</span>}</td>
                      <td style={{fontWeight: 600}}>{ag.name}</td>
                      <td dir="ltr" style={{textAlign: 'right'}}>
                        {ag.min_age_years !== null ? ag.min_age_years : ''} {ag.min_age_years !== null && ag.max_age_years !== null ? '-' : ''} {ag.max_age_years !== null ? ag.max_age_years : ''}
                        {ag.min_age_years === null && ag.max_age_years === null && <span style={{color: '#94a3b8'}}>مفتوح</span>}
                      </td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          background: ag.is_active ? '#dcfce7' : '#fee2e2',
                          color: ag.is_active ? '#166534' : '#991b1b',
                        }}>
                          {ag.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td>
                        <button className={styles.buttonSecondary} onClick={() => {
                          setEditingId(ag.id);
                          setEditAgeGroupSportId(ag.sport_id);
                        }}>تعديل</button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={styles.container} dir="rtl">
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'sports' ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('sports'); setEditingId(null); }}
        >
          الألعاب
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'sectors' ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('sectors'); setEditingId(null); }}
        >
          القطاعات (الممارسة/البطولة)
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'levels' ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('levels'); setEditingId(null); }}
        >
          المستويات
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'ageGroups' ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('ageGroups'); setEditingId(null); }}
        >
          المراحل السنية
        </button>
      </div>

      {activeTab === 'sports' && renderSportsTab()}
      {activeTab === 'sectors' && renderSectorsTab()}
      {activeTab === 'levels' && renderLevelsTab()}
      {activeTab === 'ageGroups' && renderAgeGroupsTab()}
    </div>
  );
}
