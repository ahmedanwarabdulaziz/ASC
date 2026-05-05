'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { updatePerson } from '@/server/actions/people/update-person';
import { toEnglishDigits } from '@/lib/utils/numbers';
import { resolveReturnTo } from '@/lib/utils/return-to';
import styles from './add-person-form.module.css'; // Reusing the same styles
import type { Person } from '@/types/database';

interface EditPersonFormProps {
  person: Person;
  onClose?: () => void;
}

export function EditPersonForm({ person, onClose }: EditPersonFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const returnTo = resolveReturnTo(searchParams.get('returnTo'), `/system/people/${person.id}`);

  function handleNumberInput(e: React.ChangeEvent<HTMLInputElement>) {
    e.target.value = toEnglishDigits(e.target.value).replace(/\D/g, '');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const data = {
      id: person.id,
      national_id: formData.get('national_id') as string,
      first_name: formData.get('first_name') as string,
      second_name: formData.get('second_name') as string,
      third_name: formData.get('third_name') as string,
      last_name: formData.get('last_name') as string,
      phone_number: formData.get('phone_number') as string,
      email: formData.get('email') as string,
      emergency_contact: formData.get('emergency_contact') as string,
    };

    try {
      const result = await updatePerson(data);
      if (result.success) {
        if (onClose) {
          onClose();
        } else {
          router.replace(returnTo);
        }
      } else {
        setError(result.error || 'Failed to update person.');
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'An unexpected error occurred.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.container} dir="rtl">
      <div className={styles.header}>
        <span className={styles.eyebrow}>تعديل البيانات</span>
        <h2 className={styles.title}>تعديل بيانات الشخص</h2>
        <p className={styles.description}>
          يمكنك تعديل البيانات الشخصية ومعلومات التواصل الخاصة بـ {person.first_name} {person.last_name}.
        </p>
      </div>

      {error && (
        <div className={styles.errorAlert} role="alert">
          {error}
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.sectionCard}>
          <div className={styles.sectionTitle}>البيانات الأساسية</div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="national_id">
              الرقم القومي <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="national_id"
              name="national_id"
              className={styles.input}
              required
              maxLength={14}
              minLength={14}
              pattern="\d{14}"
              title="Must be exactly 14 digits"
              placeholder="14 digits..."
              onChange={handleNumberInput}
              defaultValue={person.national_id}
              dir="ltr"
            />
          </div>

          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="first_name">
                الاسم الأول <span className={styles.required}>*</span>
              </label>
              <input type="text" id="first_name" name="first_name" className={styles.input} defaultValue={person.first_name} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="second_name">
                الاسم الثاني <span className={styles.required}>*</span>
              </label>
              <input type="text" id="second_name" name="second_name" className={styles.input} defaultValue={person.second_name} required />
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="third_name">
                الاسم الثالث <span className={styles.required}>*</span>
              </label>
              <input type="text" id="third_name" name="third_name" className={styles.input} defaultValue={person.third_name} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="last_name">
                الاسم الرابع <span className={styles.required}>*</span>
              </label>
              <input type="text" id="last_name" name="last_name" className={styles.input} defaultValue={person.last_name} required />
            </div>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionTitle}>بيانات التواصل</div>

          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="phone_number">
                رقم الموبايل
              </label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                className={styles.input}
                dir="ltr"
                pattern="^01[0125][0-9]{8}$"
                title="يجب أن يكون رقم موبايل مصري صحيح (11 رقم يبدأ بـ 01)"
                maxLength={11}
                defaultValue={person.phone_number || ''}
                onChange={handleNumberInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">
                البريد الإلكتروني
              </label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                className={styles.input} 
                defaultValue={(person as any).email || ''} 
                dir="ltr" 
                pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                title="يجب أن يكون بريد إلكتروني صحيح"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="emergency_contact">
              رقم الطوارئ
            </label>
            <input
              type="text"
              id="emergency_contact"
              name="emergency_contact"
              className={styles.input}
              dir="ltr"
              pattern="^01[0125][0-9]{8}$"
              title="يجب أن يكون رقم موبايل مصري صحيح (11 رقم يبدأ بـ 01)"
              maxLength={11}
              defaultValue={person.emergency_contact || ''}
              onChange={handleNumberInput}
            />
          </div>
        </section>

        <div className={styles.actions}>
          {onClose ? (
            <button type="button" onClick={onClose} className={styles.buttonSecondary}>
              إلغاء
            </button>
          ) : (
            <Link href={returnTo} className={styles.buttonSecondary}>
              إلغاء
            </Link>
          )}
          <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>
      </form>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
