'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { searchPersonAction } from '@/server/actions/people/search-person';
import { createStaffMember } from '@/server/actions/staff/create-staff';
import { resolveReturnTo } from '@/lib/utils/return-to';
import type { Person } from '@/types/database';
import styles from '@/features/memberships/components/add-membership-form.module.css';

interface AddStaffFormProps {
  jobs: any[];
  groups: any[];
}

export function AddStaffForm({ jobs, groups }: AddStaffFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = resolveReturnTo(searchParams.get('returnTo'), '/system/staff');

  const [nationalIdQuery, setNationalIdQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isNewPerson, setIsNewPerson] = useState(false);
  
  // Person Data
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [thirdName, setThirdName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  
  // Staff Data
  const [staffCode, setStaffCode] = useState('');
  const [jobId, setJobId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [hiredAt, setHiredAt] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleNumberInput = (value: string, setter: (nextValue: string) => void) => {
    const englishDigits = value.replace(/[٠-٩]/g, (digit) =>
      String.fromCharCode(digit.charCodeAt(0) - 1632)
    );
    if (/^\d*$/.test(englishDigits)) {
      setter(englishDigits);
    }
  };

  const handleJobSelect = (selectedJobId: string) => {
    setJobId(selectedJobId);
    const job = jobs.find(j => j.id === selectedJobId);
    if (job && job.default_group_id) {
      setGroupId(job.default_group_id);
    }
  };

  const resetSelection = () => {
    setSelectedPerson(null);
    setIsNewPerson(false);
    setFirstName('');
    setSecondName('');
    setThirdName('');
    setLastName('');
    setPhoneNumber('');
    setEmail('');
  };

  const handleSearch = async () => {
    setSearchError('');
    resetSelection();
    setFormError('');

    if (nationalIdQuery.length !== 14) {
      setSearchError('الرقم القومي يجب أن يكون 14 رقماً');
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchPersonAction(nationalIdQuery);

      if (!result.success) {
        setSearchError(result.error || 'حدث خطأ أثناء البحث');
      } else if (!result.data) {
        setIsNewPerson(true);
      } else {
        setSelectedPerson(result.data);
      }
    } catch {
      setSearchError('تعذر الاتصال بالخادم أثناء البحث');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const result = await createStaffMember({
        person_id: selectedPerson?.id,
        national_id: nationalIdQuery,
        first_name: firstName,
        second_name: secondName,
        third_name: thirdName,
        last_name: lastName,
        phone_number: phoneNumber,
        email,
        staff_code: staffCode || undefined,
        job_id: jobId,
        group_id: groupId,
        hired_at: hiredAt,
        notes: notes || undefined,
      });

      if (result.success) {
        router.replace(returnTo);
      } else {
        setFormError(result.error || 'Failed to create staff member');
      }
    } catch {
      setFormError('تعذر حفظ الموظف حالياً');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedJob = jobs.find(j => j.id === jobId);

  return (
    <div className={styles.container} dir="rtl">
      <div className={styles.header}>
        <span className={styles.eyebrow}>Staff Flow</span>
        <h2 className={styles.title}>إضافة موظف جديد</h2>
        <p className={styles.description}>
          قم بالبحث عن الشخص باستخدام الرقم القومي. إذا كان مسجلاً في النظام (عضو، تابع، لاعب)، سيتم ربطه كموظف دون تكرار البيانات.
        </p>
      </div>

      <section className={styles.sectionCard}>
        <div className={styles.sectionTitle}>التحقق من هوية الموظف</div>
        <div className={styles.formGroup}>
          <label htmlFor="nationalIdQuery" className={styles.label}>
            الرقم القومي
          </label>
          <div className={styles.searchBox}>
            <input
              id="nationalIdQuery"
              type="text"
              className={styles.input}
              dir="ltr"
              placeholder="29001011234567"
              value={nationalIdQuery}
              onChange={(event) => handleNumberInput(event.target.value, setNationalIdQuery)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  if (nationalIdQuery.length === 14 && !isSearching && !selectedPerson && !isNewPerson) {
                    handleSearch();
                  }
                }
              }}
              maxLength={14}
              disabled={isSearching || isSubmitting || selectedPerson !== null || isNewPerson}
            />
            {!selectedPerson && !isNewPerson ? (
              <button
                type="button"
                className={styles.buttonSearch}
                onClick={handleSearch}
                disabled={isSearching || nationalIdQuery.length !== 14}
              >
                {isSearching ? 'جاري البحث...' : 'بحث'}
              </button>
            ) : (
              <button
                type="button"
                className={styles.buttonSearch}
                onClick={resetSelection}
                disabled={isSubmitting}
              >
                تغيير الاختيار
              </button>
            )}
          </div>
          {searchError && <div className={styles.error}>{searchError}</div>}
        </div>
      </section>

      {selectedPerson && (
        <div className={`${styles.stateCard} ${styles.stateCardSuccess}`}>
          <div className={`${styles.personName} ${styles.successText}`}>هذا الشخص مسجل مسبقاً في النظام</div>
          <div className={styles.personDetails}>
            {selectedPerson.first_name} {selectedPerson.second_name} {selectedPerson.third_name}{' '}
            {selectedPerson.last_name}
          </div>
          <div className={styles.personDetails} dir="ltr">
            {selectedPerson.national_id}
          </div>
        </div>
      )}

      {isNewPerson && (
        <div className={`${styles.stateCard} ${styles.stateCardWarning}`}>
          <div className={`${styles.personName} ${styles.warningText}`}>شخص جديد</div>
          <div className={`${styles.personDetails} ${styles.warningText}`}>
            هذا الرقم غير مسجل بعد، لذلك سننشئ بياناته الأساسية مع بيانات الوظيفة.
          </div>
        </div>
      )}

      {(selectedPerson || isNewPerson) && (
        <form onSubmit={handleSubmit} className={styles.form}>
          {isNewPerson && (
            <section className={styles.sectionCard}>
              <div className={styles.sectionTitle}>البيانات الشخصية</div>
              <div className={styles.splitGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName" className={styles.label}>الاسم الأول</label>
                  <input id="firstName" type="text" required className={styles.input} value={firstName} onChange={e => setFirstName(e.target.value)} disabled={isSubmitting} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="secondName" className={styles.label}>الاسم الثاني</label>
                  <input id="secondName" type="text" required className={styles.input} value={secondName} onChange={e => setSecondName(e.target.value)} disabled={isSubmitting} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="thirdName" className={styles.label}>الاسم الثالث</label>
                  <input id="thirdName" type="text" required className={styles.input} value={thirdName} onChange={e => setThirdName(e.target.value)} disabled={isSubmitting} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="lastName" className={styles.label}>الاسم الرابع</label>
                  <input id="lastName" type="text" required className={styles.input} value={lastName} onChange={e => setLastName(e.target.value)} disabled={isSubmitting} />
                </div>
              </div>
              <div className={styles.splitGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="phoneNumber" className={styles.label}>رقم الموبايل</label>
                  <input id="phoneNumber" type="tel" className={styles.input} value={phoneNumber} onChange={e => handleNumberInput(e.target.value, setPhoneNumber)} pattern="^01[0125][0-9]{8}$" maxLength={11} dir="ltr" disabled={isSubmitting} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>البريد الإلكتروني</label>
                  <input id="email" type="email" className={styles.input} value={email} onChange={e => setEmail(e.target.value)} dir="ltr" disabled={isSubmitting} />
                </div>
              </div>
            </section>
          )}

          <section className={styles.sectionCard}>
            <div className={styles.sectionTitle}>البيانات الوظيفية</div>
            <div className={styles.splitGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="jobId" className={styles.label}>المسمى الوظيفي</label>
                <select id="jobId" required className={styles.input} value={jobId} onChange={e => handleJobSelect(e.target.value)} disabled={isSubmitting}>
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
                <label htmlFor="staffCode" className={styles.label}>كود الموظف (اختياري)</label>
                <input id="staffCode" type="text" className={styles.input} value={staffCode} onChange={e => setStaffCode(e.target.value)} disabled={isSubmitting} dir="ltr" />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="hiredAt" className={styles.label}>تاريخ التعيين</label>
                <input id="hiredAt" type="date" required className={styles.input} value={hiredAt} onChange={e => setHiredAt(e.target.value)} disabled={isSubmitting} />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="notes" className={styles.label}>ملاحظات التعيين (اختياري)</label>
              <textarea id="notes" className={styles.input} value={notes} onChange={e => setNotes(e.target.value)} disabled={isSubmitting} rows={3} />
            </div>

            {selectedJob && (
              <div className={styles.helperText} style={{ marginTop: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                <strong>تفاصيل الوظيفة المختارة:</strong>
                <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
                  <li>تحتاج حساب مستخدم: {selectedJob.account_policy === 'none' ? 'لا' : selectedJob.account_policy === 'required' ? 'إجباري' : 'اختياري'}</li>
                  {selectedJob.is_training_sector && <li>تابعة للقطاع الرياضي والتدريب</li>}
                </ul>
              </div>
            )}
          </section>

          {formError && <div className={styles.error}>{formError}</div>}

          <div className={styles.actions}>
            <Link href={returnTo} className={styles.buttonSecondary}>
              إلغاء
            </Link>
            <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : 'تعيين الموظف'}
            </button>
          </div>
        </form>
      )}

      {!selectedPerson && !isNewPerson && (
        <div className={styles.actions}>
          <Link href={returnTo} className={styles.buttonSecondary}>
            إلغاء
          </Link>
        </div>
      )}
    </div>
  );
}
