'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { searchPersonAction } from '@/server/actions/people/search-person';
import { createWorkingMembership } from '@/server/actions/memberships/create-working-membership';
import { resolveReturnTo } from '@/lib/utils/return-to';
import type { Person } from '@/types/database';
import styles from './add-membership-form.module.css';

export function AddMembershipForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = resolveReturnTo(searchParams.get('returnTo'), '/system/memberships');

  const [nationalIdQuery, setNationalIdQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [membershipNumber, setMembershipNumber] = useState('');
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

  const handleSearch = async () => {
    setSearchError('');
    setSelectedPerson(null);
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
        setSearchError('هذا الرقم غير مسجل في النظام. أضف الشخص أولاً ثم حاول مرة أخرى.');
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

    if (!selectedPerson) {
      setFormError('اختر الشخص أولاً قبل إصدار العضوية');
      return;
    }

    if (!membershipNumber) {
      setFormError('رقم العضوية مطلوب');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createWorkingMembership({
        person_id: selectedPerson.id,
        membership_number: membershipNumber,
      });

      if (result.success) {
        router.replace(returnTo);
      } else {
        setFormError(result.error || 'Failed to create membership');
      }
    } catch {
      setFormError('تعذر حفظ العضوية حالياً');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container} dir="rtl">
      <div className={styles.header}>
        <span className={styles.eyebrow}>Membership Issue</span>
        <h2 className={styles.title}>إصدار عضوية عاملة</h2>
        <p className={styles.description}>
          ابحث عن العضو الأساسي أولاً ثم عيّن رقم العضوية. بعد الحفظ ستعود مباشرة إلى
          السجل أو الملف الذي فتح منه النموذج.
        </p>
      </div>

      <section className={styles.sectionCard}>
        <div className={styles.sectionTitle}>اختيار العضو الأساسي</div>
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
                  if (nationalIdQuery.length === 14 && !isSearching && selectedPerson === null) {
                    handleSearch();
                  }
                }
              }}
              maxLength={14}
              disabled={isSearching || isSubmitting || selectedPerson !== null}
            />
            {!selectedPerson ? (
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
                onClick={() => setSelectedPerson(null)}
                disabled={isSubmitting}
              >
                تغيير الشخص
              </button>
            )}
          </div>
          <div className={styles.helperText}>
            استخدم الرقم القومي لضمان ربط العضوية بالشخص الصحيح وعدم تكرار السجلات.
          </div>
          {searchError && <div className={styles.error}>{searchError}</div>}
        </div>
      </section>

      {selectedPerson && (
        <div className={`${styles.stateCard} ${styles.stateCardSuccess}`}>
          <div className={`${styles.personName} ${styles.successText}`}>
            تم العثور على الشخص في النظام
          </div>
          <div className={styles.personDetails}>
            {selectedPerson.first_name} {selectedPerson.second_name} {selectedPerson.third_name}{' '}
            {selectedPerson.last_name}
          </div>
          <div className={styles.personDetails} dir="ltr">
            {selectedPerson.national_id} {selectedPerson.phone_number ? `| ${selectedPerson.phone_number}` : ''}
          </div>
        </div>
      )}

      {selectedPerson && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <section className={styles.sectionCard}>
            <div className={styles.sectionTitle}>بيانات العضوية</div>
            <div className={styles.formGroup}>
              <label htmlFor="membershipNumber" className={styles.label}>
                رقم العضوية
              </label>
              <input
                id="membershipNumber"
                type="text"
                required
                className={styles.input}
                dir="ltr"
                value={membershipNumber}
                onChange={(event) => handleNumberInput(event.target.value, setMembershipNumber)}
                disabled={isSubmitting}
              />
            </div>

            {formError && <div className={styles.error}>{formError}</div>}
          </section>

          <div className={styles.actions}>
            <Link href={returnTo} className={styles.buttonSecondary}>
              إلغاء
            </Link>
            <button
              type="submit"
              className={styles.buttonPrimary}
              disabled={isSubmitting || !membershipNumber}
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ وإصدار العضوية'}
            </button>
          </div>
        </form>
      )}

      {!selectedPerson && (
        <div className={styles.actions}>
          <Link href={returnTo} className={styles.buttonSecondary}>
            إلغاء
          </Link>
        </div>
      )}
    </div>
  );
}
