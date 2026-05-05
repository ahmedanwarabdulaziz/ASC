'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  addMedicalApproval,
  enrollPlayer,
  searchPeopleForEnrollment,
  updatePlayerLevel,
  updatePlayerStatus,
} from '@/server/actions/sports/players';
import { cancelPlayerGroupEnrollment, enrollPlayerToGroup } from '@/server/actions/sports/training-groups';
import { ROUTES } from '@/lib/constants/routes';
import { appendReturnTo } from '@/lib/utils/return-to';
import styles from './sports-settings.module.css';

type MedicalApproval = {
  id: string;
  sector_type: 'practice' | 'competition';
  status: 'valid' | 'expired' | 'revoked';
  issue_date: string;
  validity_months: number;
  expiry_date: string;
};

type TrainingEnrollment = {
  id: string;
  training_group_id: string;
  status: string;
  training_groups?: {
    id: string;
    name: string;
    status: string;
  } | null;
};

type PlayerRow = {
  id: string;
  sport_id: string;
  current_level_id: string | null;
  status: string;
  people: {
    id: string;
    first_name: string;
    second_name: string;
    third_name?: string | null;
    last_name: string;
    national_id?: string | null;
    sport_medical_approvals: MedicalApproval[];
  };
  sports?: {
    id: string;
    name: string;
  } | null;
  sport_levels?: {
    id: string;
    name: string;
  } | null;
  training_group_enrollments: TrainingEnrollment[];
};

type SportRow = {
  id: string;
  name: string;
};

type LevelRow = {
  id: string;
  sport_id: string;
  name: string;
};

type TrainingGroupRow = {
  id: string;
  sport_id: string;
  level_id: string | null;
  name: string;
  status: string;
};

type PersonSearchRow = {
  id: string;
  first_name: string;
  second_name: string;
  last_name: string;
  national_id: string | null;
};

interface PlayersClientProps {
  initialData: {
    players: PlayerRow[];
    sports: SportRow[];
    levels: LevelRow[];
    trainingGroups: TrainingGroupRow[];
    canManageMedicalApprovals: boolean;
  };
}

export function PlayersClient({ initialData }: PlayersClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [activeTab, setActiveTab] = useState<'list' | 'enroll'>('list');
  const [filterSportId, setFilterSportId] = useState('');
  const [listSearchQuery, setListSearchQuery] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PersonSearchRow[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<PersonSearchRow | null>(null);
  const [hasSearchedPeople, setHasSearchedPeople] = useState(false);

  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [viewingMedicalPlayer, setViewingMedicalPlayer] = useState<PlayerRow | null>(null);
  const [enrollingGroupPlayer, setEnrollingGroupPlayer] = useState<PlayerRow | null>(null);

  const filteredPlayers = useMemo(() => {
    const query = listSearchQuery.trim().toLowerCase();

    return initialData.players.filter((player) => {
      const sportMatch = !filterSportId || player.sport_id === filterSportId;
      const fullName = [
        player.people?.first_name,
        player.people?.second_name,
        player.people?.third_name,
        player.people?.last_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const nationalId = (player.people?.national_id || '').toLowerCase();
      const searchMatch = !query || fullName.includes(query) || nationalId.includes(query);

      return sportMatch && searchMatch;
    });
  }, [filterSportId, initialData.players, listSearchQuery]);

  const resetFeedback = () => {
    setError('');
    setNotice('');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSubmitting(true);
    resetFeedback();
    setHasSearchedPeople(true);

    const res = await searchPeopleForEnrollment(searchQuery);
    if (res.success) {
      setSearchResults(res.data);
    } else {
      setError(res.error || 'حدث خطأ في البحث.');
    }

    setIsSubmitting(false);
  };

  const handleEnroll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPerson) return;

    setIsSubmitting(true);
    resetFeedback();

    const formData = new FormData(e.currentTarget);
    formData.append('personId', selectedPerson.id);

    const res = await enrollPlayer(formData);
    if (res.success) {
      setSelectedPerson(null);
      setSearchQuery('');
      setSearchResults([]);
      setActiveTab('list');
      setNotice('تم تسجيل الشخص كلاعب بنجاح.');
      router.refresh();
    } else {
      setError(res.error || 'حدث خطأ.');
    }

    setIsSubmitting(false);
  };

  const handleUpdateLevel = async (playerId: string, sportId: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSubmitting(true);
    resetFeedback();

    const formData = new FormData(e.currentTarget);
    const newLevelId = formData.get('levelId') as string;
    const res = await updatePlayerLevel(playerId, sportId, newLevelId, 'تعديل من الإدارة');

    if (res.success) {
      setEditingPlayerId(null);
      setNotice('تم تحديث مستوى اللاعب.');
      router.refresh();
    } else {
      setError(res.error || 'حدث خطأ.');
    }

    setIsSubmitting(false);
  };

  const handleAddMedicalApproval = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!viewingMedicalPlayer) return;

    setIsSubmitting(true);
    resetFeedback();

    const formData = new FormData(e.currentTarget);
    formData.append('personId', viewingMedicalPlayer.people.id);

    const res = await addMedicalApproval(formData);
    if (res.success) {
      setNotice('تم حفظ الموافقة الطبية.');
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } else {
      setError(res.error || 'حدث خطأ في إضافة الموافقة الطبية.');
    }

    setIsSubmitting(false);
  };

  const handleEnrollPlayerToGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!enrollingGroupPlayer) return;

    setIsSubmitting(true);
    resetFeedback();

    const formData = new FormData(e.currentTarget);
    formData.append('playerId', enrollingGroupPlayer.id);

    const res = await enrollPlayerToGroup(formData);
    if (res.success) {
      setNotice(res.message || 'تم تسجيل اللاعب في المجموعة التدريبية.');
      setEnrollingGroupPlayer(null);
      router.refresh();
    } else {
      setError(res.error || 'حدث خطأ أثناء تسجيل اللاعب في المجموعة.');
    }

    setIsSubmitting(false);
  };

  const handleCancelEnrollment = async (enrollmentId: string) => {
    if (!window.confirm('هل تريد إلغاء اشتراك اللاعب في هذه المجموعة التدريبية؟')) {
      return;
    }

    setIsSubmitting(true);
    resetFeedback();

    const res = await cancelPlayerGroupEnrollment(enrollmentId);
    if (res.success) {
      setNotice(res.message || 'تم إلغاء الاشتراك.');
      router.refresh();
    } else {
      setError(res.error || 'حدث خطأ أثناء إلغاء الاشتراك.');
    }

    setIsSubmitting(false);
  };

  const renderError = () => error && <div className={styles.error}>{error}</div>;
  const renderNotice = () => notice && <div className={styles.notice}>{notice}</div>;

  return (
    <div className={styles.container} dir="rtl">
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'list' ? styles.activeTab : ''}`}
          onClick={() => {
            setActiveTab('list');
            resetFeedback();
          }}
        >
          سجل اللاعبين
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'enroll' ? styles.activeTab : ''}`}
          onClick={() => {
            setActiveTab('enroll');
            resetFeedback();
          }}
        >
          تسجيل لاعب جديد
        </button>
      </div>

      {activeTab === 'list' && (
        <div className={styles.content}>
          <div className={styles.header}>
            <h2 className={styles.title}>قائمة اللاعبين المسجلين</h2>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                className={styles.input}
                style={{ width: '280px' }}
                placeholder="ابحث بالاسم أو الرقم القومي..."
                value={listSearchQuery}
                onChange={(e) => setListSearchQuery(e.target.value)}
              />
              <select
                className={styles.input}
                style={{ width: '220px' }}
                value={filterSportId}
                onChange={(e) => setFilterSportId(e.target.value)}
              >
                <option value="">كل الألعاب</option>
                {initialData.sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {renderNotice()}
          {renderError()}

          <table className={styles.table}>
            <thead>
              <tr>
                <th>اللاعب</th>
                <th>اللعبة</th>
                <th>المستوى</th>
                <th>الحالة</th>
                <th>المجموعات الحالية</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => {
                const sportLevels = initialData.levels.filter((level) => level.sport_id === player.sport_id);
                const fullName = `${player.people.first_name} ${player.people.second_name} ${player.people.last_name}`;
                const activeEnrollments = (player.training_group_enrollments || []).filter(
                  (enrollment) => enrollment.status === 'active',
                );

                return (
                  <tr key={player.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{fullName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {player.people.national_id || 'بدون رقم قومي'}
                      </div>
                    </td>
                    <td>{player.sports?.name}</td>

                    {editingPlayerId === player.id ? (
                      <td colSpan={4}>
                        <form
                          onSubmit={(e) => handleUpdateLevel(player.id, player.sport_id, e)}
                          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}
                        >
                          <select name="levelId" defaultValue={player.current_level_id || ''} className={styles.input} required>
                            {sportLevels.map((level) => (
                              <option key={level.id} value={level.id}>
                                {level.name}
                              </option>
                            ))}
                          </select>
                          <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>
                            حفظ المستوى
                          </button>

                          <select
                            className={styles.input}
                            style={{ marginRight: 'auto', background: player.status === 'active' ? '#dcfce7' : '#fee2e2' }}
                            value={player.status}
                            onChange={async (e) => {
                              resetFeedback();
                              await updatePlayerStatus(player.id, e.target.value);
                              router.refresh();
                            }}
                            disabled={isSubmitting}
                          >
                            <option value="active">نشط</option>
                            <option value="suspended">موقوف</option>
                            <option value="ended">منتهي</option>
                          </select>

                          <button type="button" className={styles.buttonSecondary} onClick={() => setEditingPlayerId(null)}>
                            إلغاء
                          </button>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td>{player.sport_levels?.name || '-'}</td>
                        <td>
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              background:
                                player.status === 'active'
                                  ? '#dcfce7'
                                  : player.status === 'suspended'
                                    ? '#fef08a'
                                    : '#fee2e2',
                              color:
                                player.status === 'active'
                                  ? '#166534'
                                  : player.status === 'suspended'
                                    ? '#854d0e'
                                    : '#991b1b',
                            }}
                          >
                            {player.status === 'active' ? 'نشط' : player.status === 'suspended' ? 'موقوف' : 'منتهي'}
                          </span>
                        </td>
                        <td>
                          {activeEnrollments.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {activeEnrollments.map((enrollment) => (
                                <div
                                  key={enrollment.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '0.75rem',
                                  }}
                                >
                                  <span style={{ fontSize: '0.85rem', color: '#334155' }}>
                                    {enrollment.training_groups?.name || 'مجموعة غير معروفة'}
                                  </span>
                                  <button
                                    type="button"
                                    className={styles.inlineDangerButton}
                                    onClick={() => handleCancelEnrollment(enrollment.id)}
                                    disabled={isSubmitting}
                                  >
                                    إلغاء الاشتراك
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>غير مشترك في مجموعة</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                            <button className={styles.buttonSecondary} onClick={() => setEditingPlayerId(player.id)}>
                              تعديل الحالة/المستوى
                            </button>
                            <button
                              className={styles.buttonSecondary}
                              style={{ background: '#f8fafc' }}
                              onClick={() => setViewingMedicalPlayer(player)}
                            >
                              الموافقات الطبية
                            </button>
                            <button
                              className={styles.buttonPrimary}
                              onClick={() => {
                                setEnrollingGroupPlayer(player);
                                resetFeedback();
                              }}
                            >
                              تسجيل في مجموعة تدريبية
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}

              {filteredPlayers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    لا يوجد لاعبين مطابقين للبحث الحالي
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {enrollingGroupPlayer && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  borderBottom: '1px solid #cbd5e1',
                  paddingBottom: '1rem',
                }}
              >
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a' }}>
                    تسجيل اللاعب في مجموعة تدريبية: {enrollingGroupPlayer.people.first_name} {enrollingGroupPlayer.people.last_name}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    اللعبة: {enrollingGroupPlayer.sports?.name}
                  </span>
                </div>
                <button className={styles.buttonSecondary} onClick={() => setEnrollingGroupPlayer(null)}>
                  إغلاق
                </button>
              </div>

              <form onSubmit={handleEnrollPlayerToGroup}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>المجموعة التدريبية</label>
                    <select name="groupId" className={styles.input} required disabled={isSubmitting}>
                      <option value="">-- اختر المجموعة --</option>
                      {initialData.trainingGroups
                        .filter((group) => group.sport_id === enrollingGroupPlayer.sport_id)
                        .map((group) => {
                          const levelName = group.level_id
                            ? initialData.levels.find((level) => level.id === group.level_id)?.name || 'مستوى محدد'
                            : 'بدون مستوى محدد';

                          return (
                            <option key={group.id} value={group.id}>
                              {group.name} - {levelName}
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>تاريخ بداية الاشتراك في المجموعة</label>
                    <input
                      type="date"
                      name="effectiveDate"
                      className={styles.input}
                      defaultValue={new Date().toISOString().split('T')[0]}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div
                  style={{
                    marginBottom: '1rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #dbeafe',
                    color: '#1e3a8a',
                    fontSize: '0.9rem',
                    lineHeight: 1.7,
                  }}
                >
                  لن يسمح النظام بالتسجيل بدون موافقة طبية سارية. وإذا كانت المجموعة مرتبطة بمستوى مختلف، سيتم تعديل مستوى اللاعب تلقائيًا ليتوافق مع المجموعة قبل إتمام التسجيل.
                </div>

                <div className={styles.formActions}>
                  <button type="button" className={styles.buttonSecondary} onClick={() => setEnrollingGroupPlayer(null)}>
                    إلغاء
                  </button>
                  <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>
                    تسجيل اللاعب في المجموعة
                  </button>
                </div>
              </form>
            </div>
          )}

          {viewingMedicalPlayer && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>
                  الموافقات الطبية للاعب: {viewingMedicalPlayer.people.first_name} {viewingMedicalPlayer.people.last_name}
                </h3>
                <button className={styles.buttonSecondary} onClick={() => setViewingMedicalPlayer(null)}>
                  إغلاق
                </button>
              </div>

              {viewingMedicalPlayer.people.sport_medical_approvals && viewingMedicalPlayer.people.sport_medical_approvals.length > 0 ? (
                <table className={styles.table} style={{ marginBottom: '2rem' }}>
                  <thead>
                    <tr>
                      <th>القطاع</th>
                      <th>تاريخ الإصدار</th>
                      <th>المدة</th>
                      <th>تاريخ الانتهاء</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingMedicalPlayer.people.sport_medical_approvals.map((approval) => {
                      const isExpired = new Date(approval.expiry_date) < new Date();
                      return (
                        <tr key={approval.id}>
                          <td>{approval.sector_type === 'practice' ? 'الممارسة' : 'البطولة'}</td>
                          <td dir="ltr">{approval.issue_date}</td>
                          <td>{approval.validity_months} شهر</td>
                          <td dir="ltr">{approval.expiry_date}</td>
                          <td>
                            <span
                              style={{
                                padding: '0.2rem 0.6rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                background: approval.status === 'valid' && !isExpired ? '#dcfce7' : '#fee2e2',
                                color: approval.status === 'valid' && !isExpired ? '#166534' : '#991b1b',
                              }}
                            >
                              {approval.status === 'valid' && !isExpired ? 'سارية' : 'منتهية/ملغاة'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: '#64748b', marginBottom: '2rem' }}>لا توجد موافقات طبية مسجلة لهذا اللاعب.</p>
              )}

              <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 1rem 0' }}>إضافة موافقة طبية جديدة</h4>
                {initialData.canManageMedicalApprovals ? (
                  <form onSubmit={handleAddMedicalApproval}>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>القطاع</label>
                        <select name="sectorType" className={styles.input} required disabled={isSubmitting}>
                          <option value="practice">قطاع الممارسة</option>
                          <option value="competition">قطاع البطولة</option>
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>تاريخ الإصدار</label>
                        <input type="date" name="issueDate" className={styles.input} required disabled={isSubmitting} />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>المدة بالشهور</label>
                        <input type="number" name="validityMonths" className={styles.input} defaultValue="6" min="1" required disabled={isSubmitting} />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>ملاحظات</label>
                        <input type="text" name="notes" className={styles.input} disabled={isSubmitting} />
                      </div>
                    </div>
                    <div className={styles.formActions} style={{ marginTop: '1rem' }}>
                      <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>
                        حفظ الموافقة
                      </button>
                    </div>
                  </form>
                ) : (
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '8px',
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                      color: '#9a3412',
                      lineHeight: 1.8,
                    }}
                  >
                    لا يمكنك إضافة أو تعديل الموافقات الطبية من هذه الصفحة لأن حسابك لا يملك صلاحية
                    {' '}
                    <strong dir="ltr">medical_approvals.manage</strong>.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'enroll' && (
        <div className={styles.content}>
          <h2 className={styles.title} style={{ marginBottom: '1.5rem' }}>
            البحث في سجل الأشخاص
          </h2>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <input
              type="text"
              className={styles.input}
              style={{ flex: 1, maxWidth: '400px' }}
              placeholder="ابحث بالاسم أو الرقم القومي..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchResults([]);
                setSelectedPerson(null);
                setHasSearchedPeople(false);
                resetFeedback();
              }}
              disabled={isSubmitting}
            />
            <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting || !searchQuery.trim()}>
              بحث
            </button>
          </form>

          {renderNotice()}
          {renderError()}

          {searchResults.length > 0 && !selectedPerson && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
              {searchResults.map((person) => (
                <div
                  key={person.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {person.first_name} {person.second_name} {person.last_name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      الرقم القومي: {person.national_id || '-'}
                    </div>
                  </div>
                  <button
                    className={styles.buttonPrimary}
                    onClick={() => {
                      setSelectedPerson(person);
                      resetFeedback();
                    }}
                  >
                    اختيار للتسجيل
                  </button>
                </div>
              ))}
            </div>
          )}

          {hasSearchedPeople && searchResults.length === 0 && !selectedPerson && (
            <div
              style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                border: '1px dashed #cbd5e1',
                borderRadius: '12px',
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <div style={{ fontWeight: 700, color: '#0f172a' }}>
                لم يتم العثور على شخص مطابق لهذا الاسم أو الرقم القومي.
              </div>
              <div style={{ color: '#64748b', lineHeight: 1.8 }}>
                إذا كان الشخص موجودًا بالفعل في النظام فابحث مرة أخرى بصيغة مختلفة. وإذا لم يكن مسجلًا كشخص من الأساس،
                يمكنك إنشاء ملف الشخص أولًا ثم الرجوع هنا مباشرة لتسجيله كلاعب.
              </div>
              <div>
                <Link
                  href={appendReturnTo('/system/people/new', ROUTES.system.sportsPlayers)}
                  className={styles.buttonPrimary}
                  style={{ textDecoration: 'none', display: 'inline-flex' }}
                >
                  إضافة شخص جديد ثم تسجيله كلاعب
                </Link>
              </div>
            </div>
          )}

          {selectedPerson && (
            <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  borderBottom: '1px solid #cbd5e1',
                  paddingBottom: '1rem',
                }}
              >
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a' }}>
                    {selectedPerson.first_name} {selectedPerson.second_name} {selectedPerson.last_name}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: '#475569' }}>سيتم تسجيل هذا الشخص كلاعب</span>
                </div>
                <button className={styles.buttonSecondary} onClick={() => setSelectedPerson(null)}>
                  تغيير الشخص
                </button>
              </div>

              <form onSubmit={handleEnroll}>
                <div className={styles.formGrid}>
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
                    <label className={styles.label}>مستوى البداية (اختياري)</label>
                    <select name="levelId" className={styles.input} disabled={isSubmitting}>
                      <option value="">-- بدون مستوى --</option>
                      {initialData.levels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.name} (لعبة: {initialData.sports.find((sport) => sport.id === level.sport_id)?.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                    <label className={styles.label}>ملاحظات (اختياري)</label>
                    <input type="text" name="notes" className={styles.input} disabled={isSubmitting} />
                  </div>
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>
                    تسجيل اللاعب
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
