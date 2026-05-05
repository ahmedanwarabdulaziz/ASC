'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { searchPersonAction } from '@/server/actions/people/search-person';
import { addDependent } from '@/server/actions/memberships/add-dependent';
import { resolveReturnTo } from '@/lib/utils/return-to';
import type { Person } from '@/types/database';
import styles from './add-membership-form.module.css';

interface AddDependentFormProps {
  membershipId: string;
}

export function AddDependentForm({ membershipId }: AddDependentFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = resolveReturnTo(
    searchParams.get('returnTo'),
    `/system/memberships/${membershipId}`
  );

  const [nationalIdQuery, setNationalIdQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isNewPerson, setIsNewPerson] = useState(false);
  const [relationType, setRelationType] = useState('son');
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [thirdName, setThirdName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
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
      const result = await addDependent({
        membership_id: membershipId,
        relation_type: relationType,
        national_id: nationalIdQuery,
        first_name: firstName,
        second_name: secondName,
        third_name: thirdName,
        last_name: lastName,
        phone_number: phoneNumber,
        email,
        existing_person_id: selectedPerson?.id,
      });

      if (result.success) {
        router.replace(returnTo);
      } else {
        setFormError(result.error || 'Failed to add dependent');
      }
    } catch {
      setFormError('تعذر حفظ التابع حالياً');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container} dir="rtl">
      <div className={styles.header}>
        <span className={styles.eyebrow}>Dependents Flow</span>
        <h2 className={styles.title}>إضافة تابع</h2>
        <p className={styles.description}>
          ابحث أولاً بالرقم القومي لتفادي التكرار. إذا لم يكن الشخص موجوداً يمكن إنشاء بياناته
          مباشرة داخل نفس النافذة.
        </p>
      </div>

      <section className={styles.sectionCard}>
        <div className={styles.sectionTitle}>التحقق من هوية التابع</div>
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
          <div className={styles.helperText}>
            النظام سيستخدم الشخص الحالي إذا كان موجوداً، أو يسمح بإنشاء سجل جديد إذا لم يتم
            العثور عليه.
          </div>
          {searchError && <div className={styles.error}>{searchError}</div>}
        </div>
      </section>

      {selectedPerson && (
        <div className={`${styles.stateCard} ${styles.stateCardSuccess}`}>
          <div className={`${styles.personName} ${styles.successText}`}>تم العثور على الشخص</div>
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
            هذا الرقم غير مسجل بعد، لذلك سننشئ بيانات التابع الجديدة ضمن هذه الخطوة.
          </div>
        </div>
      )}

      {(selectedPerson || isNewPerson) && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <section className={styles.sectionCard}>
            <div className={styles.sectionTitle}>بيانات الربط</div>
            <div className={styles.formGroup}>
              <label htmlFor="relationType" className={styles.label}>
                صلة القرابة
              </label>
              <select
                id="relationType"
                required
                className={styles.input}
                value={relationType}
                onChange={(event) => setRelationType(event.target.value)}
                disabled={isSubmitting}
              >
                <option value="wife">زوجة</option>
                <option value="husband">زوج</option>
                <option value="son">ابن</option>
                <option value="daughter">ابنة</option>
                <option value="father">أب</option>
                <option value="mother">أم</option>
              </select>
            </div>
          </section>

          {isNewPerson && (
            <section className={styles.sectionCard}>
              <div className={styles.sectionTitle}>بيانات الشخص الجديد</div>
              <div className={styles.splitGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName" className={styles.label}>
                    الاسم الأول
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    className={styles.input}
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="secondName" className={styles.label}>
                    الاسم الثاني
                  </label>
                  <input
                    id="secondName"
                    type="text"
                    required
                    className={styles.input}
                    value={secondName}
                    onChange={(event) => setSecondName(event.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="thirdName" className={styles.label}>
                    الاسم الثالث
                  </label>
                  <input
                    id="thirdName"
                    type="text"
                    required
                    className={styles.input}
                    value={thirdName}
                    onChange={(event) => setThirdName(event.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="lastName" className={styles.label}>
                    الاسم الرابع
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    className={styles.input}
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className={styles.splitGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="phoneNumber" className={styles.label}>
                    رقم الموبايل
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    className={styles.input}
                    value={phoneNumber}
                    onChange={(event) => handleNumberInput(event.target.value, setPhoneNumber)}
                    disabled={isSubmitting}
                    pattern="^01[0125][0-9]{8}$"
                    title="يجب أن يكون رقم موبايل مصري صحيح (11 رقم يبدأ بـ 01)"
                    maxLength={11}
                    dir="ltr"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    البريد الإلكتروني
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={styles.input}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isSubmitting}
                    pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                    title="يجب أن يكون بريد إلكتروني صحيح"
                    dir="ltr"
                  />
                </div>
              </div>
            </section>
          )}

          {formError && <div className={styles.error}>{formError}</div>}

          <div className={styles.actions}>
            <Link href={returnTo} className={styles.buttonSecondary}>
              إلغاء
            </Link>
            <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ وإضافة التابع'}
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
