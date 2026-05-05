'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  addGroupCoach,
  addGroupSession,
  createTrainingGroup,
  enrollPlayerToGroup,
  removeGroupCoach,
  removeGroupSession,
  updateTrainingGroupSettings,
} from '@/server/actions/sports/training-groups';
import { searchSportPlayersForEnrollment } from '@/server/actions/sports/players';
import styles from './sports-settings.module.css';

type Sport = {
  id: string;
  name: string;
};

type Sector = {
  id: string;
  sport_id: string;
  name: string;
};

type AgeGroup = {
  id: string;
  name: string;
};

type Level = {
  id: string;
  sport_id: string;
  name: string;
};

type FacilityArea = {
  id: string;
  name: string;
  sports_facilities?: {
    name?: string | null;
  } | null;
};

type StaffMember = {
  id: string;
  people?: {
    first_name?: string | null;
    second_name?: string | null;
    last_name?: string | null;
  } | null;
};

type GroupCoach = {
  id: string;
  role: 'primary_coach' | 'assistant_coach' | 'supervisor';
  staff_members?: {
    people?: {
      first_name?: string | null;
      last_name?: string | null;
    } | null;
  } | null;
};

type GroupSession = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  facility_area_id: string;
};

type GroupEnrollment = {
  id: string;
  status: string;
  enrolled_at: string;
  sport_players?: {
    id: string;
    people?: {
      first_name?: string | null;
      second_name?: string | null;
      last_name?: string | null;
      national_id?: string | null;
    } | null;
  } | null;
};

type TrainingGroup = {
  id: string;
  sport_id: string;
  sector_id: string;
  age_group_id?: string | null;
  level_id?: string | null;
  name: string;
  status: string;
  max_players?: number | null;
  notes?: string | null;
  training_group_coaches?: GroupCoach[];
  training_group_sessions?: GroupSession[];
  training_group_enrollments?: GroupEnrollment[];
};

type SearchPlayer = {
  id: string;
  people: {
    first_name?: string | null;
    second_name?: string | null;
    last_name?: string | null;
    national_id?: string | null;
  };
};

interface TrainingGroupsClientProps {
  initialData: {
    groups: TrainingGroup[];
    sports: Sport[];
    sectors: Sector[];
    ageGroups: AgeGroup[];
    levels: Level[];
    staff: StaffMember[];
    areas: FacilityArea[];
  };
}

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function TrainingGroupsClient({ initialData }: TrainingGroupsClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'manage'>('list');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [manageSubTab, setManageSubTab] = useState<'coaches' | 'schedule' | 'players'>('coaches');
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [filterSportId, setFilterSportId] = useState('');

  const [enrollSearchQuery, setEnrollSearchQuery] = useState('');
  const [enrollSearchResults, setEnrollSearchResults] = useState<SearchPlayer[]>([]);
  const [selectedPlayerToEnroll, setSelectedPlayerToEnroll] = useState<SearchPlayer | null>(null);

  const selectedGroup = useMemo(
    () => initialData.groups.find((group) => group.id === selectedGroupId) ?? null,
    [initialData.groups, selectedGroupId],
  );

  const filteredGroups = filterSportId
    ? initialData.groups.filter((group) => group.sport_id === filterSportId)
    : initialData.groups;

  const resetFeedback = () => {
    setError('');
    setNotice('');
  };

  const openManage = (groupId: string) => {
    setSelectedGroupId(groupId);
    setActiveTab('manage');
    resetFeedback();
  };

  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    resetFeedback();

    const formData = new FormData(e.currentTarget);
    const res = await createTrainingGroup(formData);

    if (res.success) {
      setActiveTab('list');
      setNotice('تم حفظ المجموعة التدريبية.');
      router.refresh();
    } else {
      setError(res.error || 'حدث خطأ.');
    }

    setIsSubmitting(false);
  };

  const handleUpdateGroupSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGroup) return;

    setIsSubmitting(true);
    resetFeedback();

    const formData = new FormData(e.currentTarget);
    formData.append('groupId', selectedGroup.id);

    const res = await updateTrainingGroupSettings(formData);
    if (res.success) {
      setNotice(res.message || 'تم تحديث إعدادات المجموعة التدريبية.');
      router.refresh();
    } else {
      setError(res.error || 'حدث خطأ أثناء تحديث إعدادات المجموعة.');
    }

    setIsSubmitting(false);
  };

  const handleAddCoach = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGroup) return;

    setIsSubmitting(true);
    resetFeedback();

    const formData = new FormData(e.currentTarget);
    const staffId = formData.get('staffId') as string;
    const role = formData.get('role') as string;

    const res = await addGroupCoach(selectedGroup.id, staffId, role);
    if (res.success) {
      setNotice('تمت إضافة عضو الطاقم للمجموعة.');
      router.refresh();
    } else {
      setError(res.error || 'حدث خطأ.');
    }

    setIsSubmitting(false);
  };

  const handleAddSession = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGroup) return;

    setIsSubmitting(true);
    resetFeedback();

    const formData = new FormData(e.currentTarget);
    formData.append('groupId', selectedGroup.id);

    const res = await addGroupSession(formData);
    if (res.success) {
      setNotice('تمت إضافة الموعد التدريبي.');
      (e.currentTarget as HTMLFormElement).reset();
      router.refresh();
    } else {
      setError(res.error || 'حدث خطأ.');
    }

    setIsSubmitting(false);
  };

  const handleSearchPlayers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !enrollSearchQuery.trim()) return;

    setIsSubmitting(true);
    resetFeedback();

    const res = await searchSportPlayersForEnrollment(enrollSearchQuery, selectedGroup.sport_id);
    if (res.success) {
      setEnrollSearchResults(res.data as SearchPlayer[]);
      if ((res.data as SearchPlayer[]).length === 0) {
        setError('لا يوجد لاعبين مطابقين في هذه اللعبة.');
      }
    } else {
      setError(res.error || 'حدث خطأ في البحث.');
    }

    setIsSubmitting(false);
  };

  const handleEnrollPlayer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGroup || !selectedPlayerToEnroll) return;

    setIsSubmitting(true);
    resetFeedback();

    const formData = new FormData(e.currentTarget);
    formData.append('groupId', selectedGroup.id);
    formData.append('playerId', selectedPlayerToEnroll.id);

    const res = await enrollPlayerToGroup(formData);
    if (res.success) {
      setSelectedPlayerToEnroll(null);
      setEnrollSearchQuery('');
      setEnrollSearchResults([]);
      setNotice(res.message || 'تم تسجيل اللاعب في المجموعة.');
      router.refresh();
    } else {
      setError(res.error || 'حدث خطأ في التسجيل.');
    }

    setIsSubmitting(false);
  };

  const renderError = () => error && <div className={styles.error}>{error}</div>;
  const renderNotice = () => notice && <div className={styles.notice}>{notice}</div>;

  const groupedAreas = initialData.areas.reduce<Record<string, FacilityArea[]>>((acc, area) => {
    const facilityName = area.sports_facilities?.name || 'أخرى';
    if (!acc[facilityName]) acc[facilityName] = [];
    acc[facilityName].push(area);
    return acc;
  }, {});

  return (
    <div className={styles.container} dir="rtl">
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'list' ? styles.activeTab : ''}`}
          onClick={() => {
            setActiveTab('list');
            setSelectedGroupId(null);
            resetFeedback();
          }}
        >
          المجموعات الحالية
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'create' ? styles.activeTab : ''}`}
          onClick={() => {
            setActiveTab('create');
            setSelectedGroupId(null);
            resetFeedback();
          }}
        >
          إنشاء مجموعة جديدة
        </button>
        {selectedGroup && (
          <button className={`${styles.tab} ${activeTab === 'manage' ? styles.activeTab : ''}`} onClick={() => setActiveTab('manage')}>
            إدارة: {selectedGroup.name}
          </button>
        )}
      </div>

      {activeTab === 'list' && (
        <div className={styles.content}>
          <div className={styles.header}>
            <h2 className={styles.title}>قائمة المجموعات والفرق</h2>
            <select className={styles.input} style={{ width: '250px' }} value={filterSportId} onChange={(e) => setFilterSportId(e.target.value)}>
              <option value="">كل الألعاب</option>
              {initialData.sports.map((sport) => (
                <option key={sport.id} value={sport.id}>
                  {sport.name}
                </option>
              ))}
            </select>
          </div>

          {renderNotice()}
          {renderError()}

          <table className={styles.table}>
            <thead>
              <tr>
                <th>اسم المجموعة</th>
                <th>اللعبة / القطاع</th>
                <th>الفئة / المستوى</th>
                <th>الحد الأقصى</th>
                <th>المدربين</th>
                <th>الحالة</th>
                <th>إدارة</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group) => {
                const sport = initialData.sports.find((item) => item.id === group.sport_id);
                const sector = initialData.sectors.find((item) => item.id === group.sector_id);
                const ageGroup = initialData.ageGroups.find((item) => item.id === group.age_group_id);
                const level = initialData.levels.find((item) => item.id === group.level_id);

                return (
                  <tr key={group.id}>
                    <td style={{ fontWeight: 600 }}>{group.name}</td>
                    <td>
                      {sport?.name}{' '}
                      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                        ({sector?.name})
                      </span>
                    </td>
                    <td>
                      {ageGroup ? ageGroup.name : 'الكل'} / {level ? level.name : 'الكل'}
                    </td>
                    <td>{group.max_players ?? '-'}</td>
                    <td>{group.training_group_coaches?.length || 0} مدربين</td>
                    <td>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          background: group.status === 'active' ? '#dcfce7' : '#f1f5f9',
                          color: group.status === 'active' ? '#166534' : '#475569',
                        }}
                      >
                        {group.status === 'active' ? 'نشط' : group.status === 'draft' ? 'مسودة' : group.status}
                      </span>
                    </td>
                    <td>
                      <button className={styles.buttonSecondary} onClick={() => openManage(group.id)}>
                        إدارة المجموعة
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredGroups.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                    لا توجد مجموعات مسجلة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'create' && (
        <div className={styles.content}>
          <h2 className={styles.title} style={{ marginBottom: '1.5rem' }}>
            إنشاء مجموعة تدريبية جديدة
          </h2>
          {renderNotice()}
          {renderError()}

          <form onSubmit={handleCreateGroup}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>اسم المجموعة / الفريق</label>
                <input type="text" name="name" className={styles.input} required placeholder="مثال: فريق تحت 12 ناشئين" disabled={isSubmitting} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>اللعبة الرياضية</label>
                <select name="sportId" className={styles.input} required disabled={isSubmitting}>
                  <option value="">-- اختر اللعبة --</option>
                  {initialData.sports.map((sport) => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>القطاع</label>
                <select name="sectorId" className={styles.input} required disabled={isSubmitting}>
                  <option value="">-- اختر القطاع --</option>
                  {initialData.sectors.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name} ({initialData.sports.find((sport) => sport.id === sector.sport_id)?.name})
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>الفئة السنية (اختياري)</label>
                <select name="ageGroupId" className={styles.input} disabled={isSubmitting}>
                  <option value="">-- عام (بدون فئة) --</option>
                  {initialData.ageGroups.map((ageGroup) => (
                    <option key={ageGroup.id} value={ageGroup.id}>
                      {ageGroup.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>المستوى الفني (اختياري)</label>
                <select name="levelId" className={styles.input} disabled={isSubmitting}>
                  <option value="">-- عام (بدون مستوى) --</option>
                  {initialData.levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>العدد الأقصى للاعبين</label>
                <input type="number" name="maxPlayers" min="1" className={styles.input} required placeholder="مثال: 25" disabled={isSubmitting} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>حالة المجموعة</label>
                <select name="status" className={styles.input} disabled={isSubmitting}>
                  <option value="draft">مسودة (تحت الإنشاء)</option>
                  <option value="active">نشط (مفتوح)</option>
                  <option value="paused">موقوف</option>
                </select>
              </div>
              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label className={styles.label}>ملاحظات (اختياري)</label>
                <input type="text" name="notes" className={styles.input} disabled={isSubmitting} />
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>
                حفظ المجموعة
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'manage' && selectedGroup && (
        <div className={styles.content}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
            <div>
              <h2 className={styles.title} style={{ marginBottom: '0.25rem' }}>
                {selectedGroup.name}
              </h2>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                اللعبة: {initialData.sports.find((sport) => sport.id === selectedGroup.sport_id)?.name} | القطاع:{' '}
                {initialData.sectors.find((sector) => sector.id === selectedGroup.sector_id)?.name}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className={manageSubTab === 'coaches' ? styles.buttonPrimary : styles.buttonSecondary} onClick={() => setManageSubTab('coaches')}>
                طاقم التدريب
              </button>
              <button className={manageSubTab === 'schedule' ? styles.buttonPrimary : styles.buttonSecondary} onClick={() => setManageSubTab('schedule')}>
                جدول الحصص والمنشآت
              </button>
              <button className={manageSubTab === 'players' ? styles.buttonPrimary : styles.buttonSecondary} onClick={() => setManageSubTab('players')}>
                اللاعبين المسجلين
              </button>
            </div>
          </div>

          {renderNotice()}
          {renderError()}

          <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>إعدادات المجموعة الأساسية</h3>
            <form onSubmit={handleUpdateGroupSettings}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>اسم المجموعة</label>
                  <input type="text" name="name" className={styles.input} defaultValue={selectedGroup.name} required disabled={isSubmitting} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>اللعبة الرياضية</label>
                  <select name="sportId" className={styles.input} defaultValue={selectedGroup.sport_id} required disabled={isSubmitting}>
                    {initialData.sports.map((sport) => (
                      <option key={sport.id} value={sport.id}>
                        {sport.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>القطاع</label>
                  <select name="sectorId" className={styles.input} defaultValue={selectedGroup.sector_id} required disabled={isSubmitting}>
                    {initialData.sectors.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name} ({initialData.sports.find((sport) => sport.id === sector.sport_id)?.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>الفئة السنية</label>
                  <select name="ageGroupId" className={styles.input} defaultValue={selectedGroup.age_group_id || ''} disabled={isSubmitting}>
                    <option value="">-- عام (بدون فئة) --</option>
                    {initialData.ageGroups.map((ageGroup) => (
                      <option key={ageGroup.id} value={ageGroup.id}>
                        {ageGroup.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>المستوى الفني</label>
                  <select name="levelId" className={styles.input} defaultValue={selectedGroup.level_id || ''} disabled={isSubmitting}>
                    <option value="">-- عام (بدون مستوى) --</option>
                    {initialData.levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>العدد الأقصى للاعبين</label>
                  <input
                    type="number"
                    name="maxPlayers"
                    min="1"
                    className={styles.input}
                    defaultValue={selectedGroup.max_players || ''}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>حالة المجموعة</label>
                  <select name="status" className={styles.input} defaultValue={selectedGroup.status} disabled={isSubmitting}>
                    <option value="draft">مسودة</option>
                    <option value="active">نشط</option>
                    <option value="paused">موقوف</option>
                    <option value="archived">مؤرشف</option>
                  </select>
                </div>
                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                  <label className={styles.label}>ملاحظات</label>
                  <input type="text" name="notes" className={styles.input} defaultValue={selectedGroup.notes || ''} disabled={isSubmitting} />
                </div>
              </div>
              <div className={styles.formActions} style={{ marginTop: '1rem' }}>
                <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>
                  حفظ إعدادات المجموعة
                </button>
              </div>
            </form>
          </div>

          {manageSubTab === 'coaches' && (
            <div>
              <form onSubmit={handleAddCoach} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.label} style={{ display: 'block', marginBottom: '0.5rem' }}>
                    اختيار المدرب
                  </label>
                  <select name="staffId" className={styles.input} style={{ width: '100%' }} required disabled={isSubmitting}>
                    <option value="">-- اختر من قائمة الموظفين النشطين --</option>
                    {initialData.staff.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.people?.first_name} {staff.people?.second_name} {staff.people?.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={styles.label} style={{ display: 'block', marginBottom: '0.5rem' }}>
                    المنصب / الدور
                  </label>
                  <select name="role" className={styles.input} disabled={isSubmitting}>
                    <option value="primary_coach">مدرب أساسي</option>
                    <option value="assistant_coach">مساعد مدرب</option>
                    <option value="supervisor">مشرف إداري</option>
                  </select>
                </div>
                <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>
                  إضافة للطاقم
                </button>
              </form>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>المدرب</th>
                    <th>الدور</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedGroup.training_group_coaches || []).map((coach) => (
                    <tr key={coach.id}>
                      <td style={{ fontWeight: 600 }}>
                        {coach.staff_members?.people?.first_name} {coach.staff_members?.people?.last_name}
                      </td>
                      <td>
                        {coach.role === 'primary_coach' && 'مدرب أساسي'}
                        {coach.role === 'assistant_coach' && 'مساعد مدرب'}
                        {coach.role === 'supervisor' && 'مشرف إداري'}
                      </td>
                      <td>
                        <button
                          style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                          onClick={async () => {
                            if (window.confirm('هل أنت متأكد من إزالة المدرب من المجموعة؟')) {
                              await removeGroupCoach(coach.id);
                              router.refresh();
                            }
                          }}
                        >
                          إزالة
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!selectedGroup.training_group_coaches || selectedGroup.training_group_coaches.length === 0) && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '1rem' }}>
                        لم يتم تعيين أي مدربين لهذه المجموعة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {manageSubTab === 'schedule' && (
            <div>
              <form onSubmit={handleAddSession} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', flexWrap: 'wrap' }}>
                <div>
                  <label className={styles.label} style={{ display: 'block', marginBottom: '0.5rem' }}>
                    اليوم
                  </label>
                  <select name="dayOfWeek" className={styles.input} required disabled={isSubmitting}>
                    <option value="">-- اختر --</option>
                    {DAYS.map((day, idx) => (
                      <option key={idx} value={idx}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={styles.label} style={{ display: 'block', marginBottom: '0.5rem' }}>
                    من الساعة
                  </label>
                  <input type="time" name="startTime" className={styles.input} required disabled={isSubmitting} />
                </div>
                <div>
                  <label className={styles.label} style={{ display: 'block', marginBottom: '0.5rem' }}>
                    إلى الساعة
                  </label>
                  <input type="time" name="endTime" className={styles.input} required disabled={isSubmitting} />
                </div>
                <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                  <label className={styles.label} style={{ display: 'block', marginBottom: '0.5rem' }}>
                    المنشأة (الساحة / الملعب)
                  </label>
                  <div
                    onClick={() => setIsAreaDropdownOpen((prev) => !prev)}
                    style={{
                      background: '#fff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: '#475569' }}>-- اختر ساحة واحدة أو أكثر --</span>
                    <span>▼</span>
                  </div>

                  {isAreaDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 50,
                        background: '#fff',
                        padding: '1rem',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        marginTop: '4px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '1rem',
                      }}
                    >
                      {Object.entries(groupedAreas).map(([facilityName, areas]) => (
                        <div key={facilityName} style={{ marginBottom: '1rem' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e452b', fontSize: '0.9rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>
                            {facilityName}
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', color: '#1e293b', fontWeight: 600 }}>
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const checkboxes = document.querySelectorAll(`input[data-facility="${facilityName}"]`) as NodeListOf<HTMLInputElement>;
                                checkboxes.forEach((checkbox) => {
                                  checkbox.checked = checked;
                                });
                              }}
                              disabled={isSubmitting}
                            />
                            <span>تحديد {facilityName} بالكامل</span>
                          </label>
                          {areas.map((area) => (
                            <label key={area.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', fontSize: '0.85rem', cursor: 'pointer', color: '#334155' }}>
                              <input type="checkbox" name="areaId" value={area.id} data-facility={facilityName} disabled={isSubmitting} />
                              <span>{area.name}</span>
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ flex: 'none', display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting} style={{ height: '42px' }}>
                    إضافة المواعيد
                  </button>
                </div>
              </form>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>اليوم</th>
                    <th>التوقيت</th>
                    <th>المنشأة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedGroup.training_group_sessions || [])
                    .slice()
                    .sort((a, b) => a.day_of_week - b.day_of_week)
                    .map((session) => {
                      const area = initialData.areas.find((item) => item.id === session.facility_area_id);
                      return (
                        <tr key={session.id}>
                          <td style={{ fontWeight: 600 }}>{DAYS[session.day_of_week]}</td>
                          <td style={{ direction: 'ltr', textAlign: 'right' }}>
                            {session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}
                          </td>
                          <td>
                            {area?.name}{' '}
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              ({area?.sports_facilities?.name})
                            </span>
                          </td>
                          <td>
                            <button
                              style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                              onClick={async () => {
                                if (window.confirm('هل أنت متأكد من إلغاء هذا الموعد التدريبي؟')) {
                                  await removeGroupSession(session.id);
                                  router.refresh();
                                }
                              }}
                            >
                              حذف الموعد
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {(!selectedGroup.training_group_sessions || selectedGroup.training_group_sessions.length === 0) && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '1rem' }}>
                        لا توجد مواعيد تدريبية محددة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {manageSubTab === 'players' && (
            <div>
              <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>تسجيل لاعب في المجموعة</h3>
                <form onSubmit={handleSearchPlayers} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    className={styles.input}
                    style={{ flex: 1, maxWidth: '400px' }}
                    placeholder="ابحث باسم اللاعب أو الرقم القومي..."
                    value={enrollSearchQuery}
                    onChange={(e) => setEnrollSearchQuery(e.target.value)}
                  />
                  <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>
                    بحث عن لاعب
                  </button>
                </form>

                {enrollSearchResults.length > 0 && !selectedPlayerToEnroll && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {enrollSearchResults.map((player) => (
                      <div
                        key={player.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          background: '#fff',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {player.people.first_name} {player.people.second_name} {player.people.last_name}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            الرقم القومي: {player.people.national_id || '-'}
                          </div>
                        </div>
                        <button
                          className={styles.buttonSecondary}
                          onClick={() => {
                            setSelectedPlayerToEnroll(player);
                            resetFeedback();
                          }}
                        >
                          اختيار للتسجيل
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedPlayerToEnroll && (
                  <div style={{ padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {selectedPlayerToEnroll.people.first_name} {selectedPlayerToEnroll.people.last_name}
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>سيتم تسجيل هذا اللاعب في المجموعة</span>
                      </div>
                      <button className={styles.buttonSecondary} onClick={() => setSelectedPlayerToEnroll(null)}>
                        إلغاء
                      </button>
                    </div>

                    <form onSubmit={handleEnrollPlayer}>
                      <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>
                        تأكيد التسجيل
                      </button>
                    </form>
                  </div>
                )}
              </div>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>اللاعب</th>
                    <th>الرقم القومي</th>
                    <th>تاريخ التسجيل</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedGroup.training_group_enrollments || []).map((enrollment) => {
                    const person = enrollment.sport_players?.people;
                    return (
                      <tr key={enrollment.id}>
                        <td style={{ fontWeight: 600 }}>
                          {person?.first_name} {person?.second_name} {person?.last_name}
                        </td>
                        <td>{person?.national_id || '-'}</td>
                        <td dir="ltr" style={{ textAlign: 'right' }}>
                          {enrollment.enrolled_at}
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              background: enrollment.status === 'active' ? '#dcfce7' : '#fee2e2',
                              color: enrollment.status === 'active' ? '#166534' : '#991b1b',
                            }}
                          >
                            {enrollment.status === 'active' ? 'نشط' : 'منتهي / معلق'}
                          </span>
                        </td>
                        <td>
                          <button className={styles.buttonSecondary} disabled>
                            نقل / تعديل
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {(!selectedGroup.training_group_enrollments || selectedGroup.training_group_enrollments.length === 0) && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>
                        لا يوجد لاعبين مسجلين في هذه المجموعة حاليًا
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
