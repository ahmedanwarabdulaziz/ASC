'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  createSessionOccurrence, 
  getOccurrenceDetails, 
  recordSingleAttendance, 
  completeSessionAttendance 
} from '@/server/actions/sports/attendance';
import styles from './sports-settings.module.css';

interface AttendanceClientProps {
  initialData: {
    occurrences: any[];
    scheduledSessions: any[];
    groups: any[];
  };
  currentDate: string;
}

export function AttendanceClient({ initialData, currentDate }: AttendanceClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [selectedOccurrence, setSelectedOccurrence] = useState<any | null>(null);

  // When occurrence is selected, fetch its details (enrollments and attendance)
  useEffect(() => {
    if (selectedOccurrence && !selectedOccurrence.detailsLoaded) {
      const loadDetails = async () => {
        setIsSubmitting(true);
        const res = await getOccurrenceDetails(selectedOccurrence.id);
        if (res.success) {
          setSelectedOccurrence({ ...res.data, detailsLoaded: true });
        } else {
          setError(res.error || 'خطأ في تحميل تفاصيل الجلسة');
        }
        setIsSubmitting(false);
      };
      loadDetails();
    }
  }, [selectedOccurrence]);

  const handleCreateOccurrence = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const res = await createSessionOccurrence(formData);
    
    if (res.success) {
      setActiveTab('list');
      router.refresh();
    } else {
      setError(res.error || 'خطأ');
    }
    setIsSubmitting(false);
  };

  const handleRecordAttendance = async (enrollmentId: string, status: string) => {
    if (!selectedOccurrence) return;
    setIsSubmitting(true);
    
    const res = await recordSingleAttendance(selectedOccurrence.id, enrollmentId, status);
    if (res.success) {
      // Optimistically update local state
      const newAttendance = [...(selectedOccurrence.training_session_attendance || [])];
      const idx = newAttendance.findIndex((a: any) => a.training_group_enrollment_id === enrollmentId);
      if (idx >= 0) {
        newAttendance[idx] = { ...newAttendance[idx], attendance_status: status };
      } else {
        newAttendance.push({ training_group_enrollment_id: enrollmentId, attendance_status: status });
      }
      setSelectedOccurrence({ ...selectedOccurrence, training_session_attendance: newAttendance });
    } else {
      setError(res.error || 'خطأ');
    }
    setIsSubmitting(false);
  };

  const handleCompleteSession = async () => {
    if (!selectedOccurrence) return;
    if (!confirm('هل أنت متأكد من إنهاء الجلسة؟ سيتم تسجيل جميع اللاعبين المتبقين كغائبين تلقائياً.')) return;
    
    setIsSubmitting(true);
    const res = await completeSessionAttendance(selectedOccurrence.id);
    if (res.success) {
      alert(`تم إغلاق الجلسة وتسجيل ${res.count} غياب تلقائي.`);
      setSelectedOccurrence(null);
      router.refresh();
    } else {
      setError(res.error || 'خطأ');
    }
    setIsSubmitting(false);
  };

  const handleStartScheduledSession = async (session: any) => {
    try {
      setIsSubmitting(true);
      setError('');
      const formData = new FormData();
      formData.append('groupId', session.training_group_id);
      formData.append('sessionId', session.id);
      formData.append('facilityAreaId', session.facility_area_id);
      formData.append('occurrenceDate', selectedDate);
      formData.append('startTime', session.start_time);
      formData.append('endTime', session.end_time);
      
      const res = await createSessionOccurrence(formData);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || 'خطأ في بدء الجلسة');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderError = () => error && <div className={styles.error}>{error}</div>;

  // Merge scheduled sessions and created occurrences for display
  const displayItems: any[] = [];
  
  // 1. Add all created occurrences
  initialData.occurrences.forEach(occ => {
    displayItems.push({
      type: 'occurrence',
      id: occ.id,
      groupId: occ.training_group_id,
      sessionId: occ.training_group_session_id,
      groupName: occ.training_groups?.name,
      sportName: occ.training_groups?.sports?.name,
      startTime: occ.start_time,
      endTime: occ.end_time,
      facilityName: occ.facility_areas?.name || '-',
      staffName: occ.staff_members ? `${occ.staff_members.people?.first_name} ${occ.staff_members.people?.last_name}` : '-',
      status: occ.status,
      originalData: occ
    });
  });

  // 2. Add scheduled sessions that don't have an occurrence yet
  initialData.scheduledSessions.forEach(sess => {
    const hasOccurrence = initialData.occurrences.some(occ => occ.training_group_session_id === sess.id);
    if (!hasOccurrence) {
      displayItems.push({
        type: 'scheduled',
        id: sess.id,
        groupId: sess.training_group_id,
        sessionId: sess.id,
        groupName: sess.training_groups?.name,
        sportName: sess.training_groups?.sports?.name,
        startTime: sess.start_time,
        endTime: sess.end_time,
        facilityName: sess.facility_areas?.name || '-',
        staffName: '-',
        status: 'not_started',
        originalData: sess
      });
    }
  });

  // Sort by start time
  displayItems.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className={styles.container} dir="rtl">
      
      {!selectedOccurrence ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div className={styles.tabs} style={{ margin: 0, padding: 0, border: 'none', background: 'transparent' }}>
              <button
                className={`${styles.tab} ${activeTab === 'list' ? styles.activeTab : ''}`}
                onClick={() => { setActiveTab('list'); setError(''); }}
              >
                جلسات اليوم
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'create' ? styles.activeTab : ''}`}
                onClick={() => { setActiveTab('create'); setError(''); }}
              >
                إنشاء جلسة استثنائية
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <form action={() => router.push(`/system/sports/attendance?date=${selectedDate}`)} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="date" 
                  className={styles.input} 
                  value={selectedDate} 
                  onChange={e => setSelectedDate(e.target.value)}
                />
                <button type="submit" className={styles.buttonSecondary}>عرض التاريخ</button>
              </form>
            </div>
          </div>

          {renderError()}

          {activeTab === 'list' && (
            <div className={styles.content}>
              <h2 className={styles.title} style={{ marginBottom: '1.5rem' }}>جلسات التدريب: {selectedDate}</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>المجموعة</th>
                    <th>التوقيت</th>
                    <th>الساحة / المدرب</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((item, idx) => (
                    <tr key={`${item.type}-${item.id}-${idx}`}>
                      <td style={{fontWeight: 600}}>
                        {item.groupName}
                        <div style={{fontSize: '0.8rem', color: '#64748b'}}>{item.sportName}</div>
                      </td>
                      <td dir="ltr" style={{textAlign: 'right'}}>{item.startTime.substring(0,5)} - {item.endTime.substring(0,5)}</td>
                      <td>
                        {item.facilityName}
                        <div style={{fontSize: '0.8rem', color: '#64748b'}}>{item.staffName}</div>
                      </td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem',
                          background: item.status === 'completed' ? '#dcfce7' : (item.status === 'scheduled' ? '#fef08a' : '#f1f5f9'),
                          color: item.status === 'completed' ? '#166534' : (item.status === 'scheduled' ? '#854d0e' : '#475569'),
                        }}>
                          {item.status === 'completed' ? 'مكتملة' : (item.status === 'scheduled' ? 'مجدولة/قيد التنفيذ' : 'لم تبدأ بعد')}
                        </span>
                      </td>
                      <td>
                        {item.type === 'occurrence' ? (
                          <button className={styles.buttonSecondary} onClick={() => setSelectedOccurrence(item.originalData)}>
                            {item.status === 'completed' ? 'عرض الكشف' : 'تسجيل الحضور'}
                          </button>
                        ) : (
                          <button 
                            className={styles.buttonPrimary} 
                            onClick={() => handleStartScheduledSession(item.originalData)}
                            disabled={isSubmitting}
                          >
                            بدء الجلسة
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {displayItems.length === 0 && (
                    <tr><td colSpan={5} style={{textAlign: 'center', padding: '2rem'}}>لا توجد جلسات مسجلة في هذا اليوم</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'create' && (
            <div className={styles.content}>
              <h2 className={styles.title} style={{ marginBottom: '1.5rem' }}>إنشاء جلسة تدريب</h2>
              <form onSubmit={handleCreateOccurrence}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>المجموعة التدريبية</label>
                    <select name="groupId" className={styles.input} required disabled={isSubmitting}>
                      <option value="">-- اختر --</option>
                      {initialData.groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.sports?.name})</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>التاريخ</label>
                    <input type="date" name="occurrenceDate" className={styles.input} defaultValue={selectedDate} required disabled={isSubmitting} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>من الساعة</label>
                    <input type="time" name="startTime" className={styles.input} required disabled={isSubmitting} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>إلى الساعة</label>
                    <input type="time" name="endTime" className={styles.input} required disabled={isSubmitting} />
                  </div>
                </div>
                <div className={styles.formActions} style={{marginTop: '1.5rem'}}>
                  <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>إنشاء الجلسة</button>
                </div>
              </form>
            </div>
          )}
        </>
      ) : (
        <div className={styles.content}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
            <div>
              <h2 className={styles.title} style={{ marginBottom: '0.25rem' }}>كشف حضور: {selectedOccurrence.training_groups?.name}</h2>
              <p style={{ margin: 0, color: '#64748b' }}>
                {selectedOccurrence.occurrence_date} | {selectedOccurrence.start_time.substring(0,5)} - {selectedOccurrence.end_time.substring(0,5)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className={styles.buttonSecondary} onClick={() => setSelectedOccurrence(null)}>العودة</button>
              {selectedOccurrence.status !== 'completed' && (
                <button className={styles.buttonPrimary} onClick={handleCompleteSession} disabled={isSubmitting}>إغلاق الجلسة (اعتماد الكشف)</button>
              )}
            </div>
          </div>

          {renderError()}

          {!selectedOccurrence.detailsLoaded ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>جاري تحميل الكشف...</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>اللاعب</th>
                  <th>الرقم القومي</th>
                  <th>حالة الحضور</th>
                </tr>
              </thead>
              <tbody>
                {selectedOccurrence.training_groups?.training_group_enrollments?.filter((e: any) => e.status === 'active').map((enrollment: any) => {
                  const person = enrollment.sport_players?.people;
                  const attRecord = selectedOccurrence.training_session_attendance?.find((a: any) => a.training_group_enrollment_id === enrollment.id);
                  const isCompleted = selectedOccurrence.status === 'completed';

                  return (
                    <tr key={enrollment.id}>
                      <td style={{fontWeight: 600}}>{person?.first_name} {person?.second_name} {person?.last_name}</td>
                      <td>{person?.national_id || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className={styles.buttonSecondary} 
                            style={{ 
                              background: attRecord?.attendance_status === 'present' ? '#22c55e' : (isCompleted ? '#f1f5f9' : '#fff'),
                              color: attRecord?.attendance_status === 'present' ? '#fff' : '#334155',
                              borderColor: attRecord?.attendance_status === 'present' ? '#22c55e' : '#cbd5e1',
                              padding: '0.4rem 1rem'
                            }}
                            onClick={() => handleRecordAttendance(enrollment.id, 'present')}
                            disabled={isSubmitting}
                          >
                            حضور
                          </button>
                          <button 
                            className={styles.buttonSecondary} 
                            style={{ 
                              background: attRecord?.attendance_status === 'absent' ? '#ef4444' : (isCompleted ? '#f1f5f9' : '#fff'),
                              color: attRecord?.attendance_status === 'absent' ? '#fff' : '#334155',
                              borderColor: attRecord?.attendance_status === 'absent' ? '#ef4444' : '#cbd5e1',
                              padding: '0.4rem 1rem'
                            }}
                            onClick={() => handleRecordAttendance(enrollment.id, 'absent')}
                            disabled={isSubmitting}
                          >
                            غياب
                          </button>
                          <button 
                            className={styles.buttonSecondary} 
                            style={{ 
                              background: attRecord?.attendance_status === 'excused' ? '#eab308' : (isCompleted ? '#f1f5f9' : '#fff'),
                              color: attRecord?.attendance_status === 'excused' ? '#fff' : '#334155',
                              borderColor: attRecord?.attendance_status === 'excused' ? '#eab308' : '#cbd5e1',
                              padding: '0.4rem 1rem'
                            }}
                            onClick={() => handleRecordAttendance(enrollment.id, 'excused')}
                            disabled={isSubmitting}
                          >
                            عذر
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(!selectedOccurrence.training_groups?.training_group_enrollments || selectedOccurrence.training_groups?.training_group_enrollments.filter((e:any)=>e.status==='active').length === 0) && (
                  <tr><td colSpan={3} style={{textAlign: 'center', padding: '2rem'}}>لا يوجد لاعبين نشطين في هذه المجموعة</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

    </div>
  );
}
