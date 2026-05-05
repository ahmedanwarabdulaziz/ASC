'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { updateStaffMember } from '@/server/actions/staff/update-staff';
import { archiveStaffMember } from '@/server/actions/staff/archive-staff';
import { resolveReturnTo } from '@/lib/utils/return-to';
import { AccountManager } from './account-manager';
import styles from '@/features/memberships/components/add-membership-form.module.css';

interface EditStaffFormProps {
  staffMember: any;
  jobs: any[];
  groups: any[];
}

export function EditStaffForm({ staffMember, jobs, groups }: EditStaffFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = resolveReturnTo(searchParams.get('returnTo'), '/system/staff');

  const person = staffMember.person;
  
  // Extract system user states
  const systemUsers = person?.system_users || [];
  const systemUser = systemUsers.length > 0 ? systemUsers[0] : null;
  const hasSystemUser = !!systemUser;
  const systemUserActive = systemUser?.is_active ?? false;
  const isLinkedToStaff = staffMember.user_id && systemUser ? staffMember.user_id === systemUser.auth_user_id : false;

  // Person Data
  const [updatePerson, setUpdatePerson] = useState(false);
  const [nationalId, setNationalId] = useState(person?.national_id || '');
  const [firstName, setFirstName] = useState(person?.first_name || '');
  const [secondName, setSecondName] = useState(person?.second_name || '');
  const [thirdName, setThirdName] = useState(person?.third_name || '');
  const [lastName, setLastName] = useState(person?.last_name || '');
  const [phoneNumber, setPhoneNumber] = useState(person?.phone_number || '');
  const [email, setEmail] = useState(person?.email || '');

  // Staff Data
  const [staffCode, setStaffCode] = useState(staffMember.staff_code || '');
  const [jobId, setJobId] = useState(staffMember.job_id || '');
  const [groupId, setGroupId] = useState(staffMember.group_id || '');
  const [status, setStatus] = useState<'active' | 'suspended' | 'ended'>(staffMember.status);
  const [hiredAt, setHiredAt] = useState(staffMember.hired_at || '');
  const [endedAt, setEndedAt] = useState(staffMember.ended_at || '');
  const [notes, setNotes] = useState(staffMember.notes || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const handleNumberInput = (value: string, setter: (nextValue: string) => void) => {
    const englishDigits = value.replace(/[٠-٩]/g, (digit) =>
      String.fromCharCode(digit.charCodeAt(0) - 1632)
    );
    if (/^\d*$/.test(englishDigits)) {
      setter(englishDigits);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const result = await updateStaffMember({
        id: staffMember.id,
        staff_code: staffCode || undefined,
        job_id: jobId,
        group_id: groupId,
        status,
        hired_at: hiredAt || null,
        ended_at: status === 'ended' ? (endedAt || new Date().toISOString().split('T')[0]) : null,
        notes: notes || null,
        
        update_person: updatePerson,
        national_id: nationalId,
        first_name: firstName,
        second_name: secondName,
        third_name: thirdName,
        last_name: lastName,
        phone_number: phoneNumber,
        email,
      });

      if (result.success) {
        router.replace(returnTo);
      } else {
        setFormError(result.error || 'Failed to update staff member');
      }
    } catch {
      setFormError('تعذر تحديث بيانات الموظف حالياً');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    setFormError('');
    setIsSubmitting(true);
    try {
      const result = await archiveStaffMember(staffMember.id, notes, endedAt || new Date().toISOString().split('T')[0]);
      if (result.success) {
        router.replace(returnTo);
      } else {
        setFormError(result.error || 'Failed to archive staff member');
        setIsSubmitting(false);
      }
    } catch {
      setFormError('تعذر إنهاء عمل الموظف حالياً');
      setIsSubmitting(false);
    }
  };

  if (showArchiveConfirm) {
    return (
      <div className={styles.container} dir="rtl">
        <div className={`${styles.stateCard} ${styles.stateCardWarning}`}>
          <h3 className={`${styles.title} ${styles.warningText}`}>تأكيد إنهاء العمل</h3>
          <p>أنت على وشك إنهاء عمل الموظف <strong>{firstName} {lastName}</strong>.</p>
          <p>لن يتم حذف بيانات الشخص من النظام، ولكن ستتغير حالته الوظيفية إلى منتهي ويفقد صلاحيات الدخول.</p>
          
          <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
            <label className={styles.label}>تاريخ الإنهاء</label>
            <input type="date" className={styles.input} value={endedAt || new Date().toISOString().split('T')[0]} onChange={e => setEndedAt(e.target.value)} />
          </div>
          <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
            <label className={styles.label}>ملاحظات إضافية (اختياري)</label>
            <textarea className={styles.input} value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </div>

          {formError && <div className={styles.error} style={{ marginTop: '1rem' }}>{formError}</div>}

          <div className={styles.actions} style={{ marginTop: '2rem' }}>
            <button type="button" className={styles.buttonSecondary} onClick={() => setShowArchiveConfirm(false)} disabled={isSubmitting}>
              إلغاء التراجع
            </button>
            <button type="button" className={styles.buttonDanger} onClick={handleArchive} disabled={isSubmitting} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 600 }}>
              {isSubmitting ? 'جاري التنفيذ...' : 'تأكيد الإنهاء'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} dir="rtl">
      <div className={styles.header}>
        <span className={styles.eyebrow}>Staff Management</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 className={styles.title}>تعديل بيانات الموظف</h2>
            <p className={styles.description}>تعديل البيانات الوظيفية أو الشخصية للموظف: {person?.first_name} {person?.last_name}</p>
          </div>
          {status !== 'ended' && (
            <button 
              type="button" 
              className={styles.buttonSecondary} 
              style={{ color: '#ef4444', borderColor: '#fca5a5', background: '#fef2f2' }}
              onClick={() => setShowArchiveConfirm(true)}
            >
              إنهاء العمل
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <section className={styles.sectionCard}>
          <div className={styles.sectionTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>البيانات الشخصية</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 'normal' }}>
              <input type="checkbox" id="updatePerson" checked={updatePerson} onChange={e => setUpdatePerson(e.target.checked)} disabled={isSubmitting} />
              <label htmlFor="updatePerson">تحديث بيانات الشخص في السجل المركزي</label>
            </div>
          </div>
          <div className={styles.splitGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="firstName" className={styles.label}>الاسم الأول</label>
              <input id="firstName" type="text" required className={styles.input} value={firstName} onChange={e => setFirstName(e.target.value)} disabled={!updatePerson || isSubmitting} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="lastName" className={styles.label}>الاسم الرابع</label>
              <input id="lastName" type="text" required className={styles.input} value={lastName} onChange={e => setLastName(e.target.value)} disabled={!updatePerson || isSubmitting} />
            </div>
          </div>
          <div className={styles.splitGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="phoneNumber" className={styles.label}>رقم الموبايل</label>
              <input id="phoneNumber" type="tel" className={styles.input} value={phoneNumber} onChange={e => handleNumberInput(e.target.value, setPhoneNumber)} pattern="^01[0125][0-9]{8}$" maxLength={11} dir="ltr" disabled={!updatePerson || isSubmitting} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="nationalId" className={styles.label}>الرقم القومي</label>
              <input id="nationalId" type="text" required className={styles.input} value={nationalId} onChange={e => handleNumberInput(e.target.value, setNationalId)} maxLength={14} dir="ltr" disabled={!updatePerson || isSubmitting} />
            </div>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionTitle}>البيانات الوظيفية</div>
          <div className={styles.splitGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="jobId" className={styles.label}>المسمى الوظيفي</label>
              <select id="jobId" required className={styles.input} value={jobId} onChange={e => setJobId(e.target.value)} disabled={isSubmitting}>
                <option value="">اختر الوظيفة</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.name}</option>
                ))}
              </select>
              {jobId && (() => {
                const selectedJob = jobs.find(j => j.id === jobId);
                if (!selectedJob) return null;
                return (
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                    {selectedJob.is_training_sector ? (
                      <span style={{ fontSize: '0.75rem', background: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>وظيفة قطاع تدريب</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>وظيفة إدارية (لن يظهر كمدرب)</span>
                    )}
                    
                    {selectedJob.is_training_commissionable && (
                      <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>يخضع لنسبة تدريب</span>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="groupId" className={styles.label}>مجموعة الصلاحيات</label>
              <select id="groupId" required className={styles.input} value={groupId} onChange={e => setGroupId(e.target.value)} disabled={isSubmitting}>
                <option value="">اختر الصلاحية</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className={styles.splitGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="staffCode" className={styles.label}>كود الموظف</label>
              <input id="staffCode" type="text" className={styles.input} value={staffCode} onChange={e => setStaffCode(e.target.value)} disabled={isSubmitting} dir="ltr" />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="status" className={styles.label}>حالة العمل</label>
              <select id="status" required className={styles.input} value={status} onChange={e => setStatus(e.target.value as any)} disabled={isSubmitting}>
                <option value="active">نشط</option>
                <option value="suspended">موقوف</option>
                <option value="ended">منتهي العمل</option>
              </select>
            </div>
          </div>

          <div className={styles.splitGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="hiredAt" className={styles.label}>تاريخ التعيين</label>
              <input id="hiredAt" type="date" className={styles.input} value={hiredAt} onChange={e => setHiredAt(e.target.value)} disabled={isSubmitting} />
            </div>
            {status === 'ended' && (
              <div className={styles.formGroup}>
                <label htmlFor="endedAt" className={styles.label}>تاريخ الإنهاء</label>
                <input id="endedAt" type="date" required className={styles.input} value={endedAt} onChange={e => setEndedAt(e.target.value)} disabled={isSubmitting} />
              </div>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="notes" className={styles.label}>ملاحظات إضافية</label>
            <textarea id="notes" className={styles.input} value={notes} onChange={e => setNotes(e.target.value)} disabled={isSubmitting} rows={3} />
          </div>
        </section>

        {formError && <div className={styles.error}>{formError}</div>}

        <div className={styles.actions}>
          <Link href={returnTo} className={styles.buttonSecondary}>
            إلغاء
          </Link>
          <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>
      </form>

      {/* Account Management is completely separate from the main form submission */}
      {status !== 'ended' && (
        <AccountManager 
          personId={person.id}
          staffMemberId={staffMember.id}
          personName={`${person.first_name} ${person.last_name}`}
          personNationalId={person.national_id || ''}
          hasSystemUser={hasSystemUser}
          systemUserActive={systemUserActive}
          isLinkedToStaff={isLinkedToStaff}
        />
      )}
    </div>
  );
}
