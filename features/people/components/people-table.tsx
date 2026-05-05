import Link from 'next/link';
import { appendReturnTo } from '@/lib/utils/return-to';
import type { Person } from '@/types/database';
import styles from './people-table.module.css';

interface PeopleTableProps {
  people: Person[];
  returnTo?: string;
}

export function PeopleTable({ people, returnTo }: PeopleTableProps) {
  if (!people || people.length === 0) {
    return (
      <div className={styles.tableContainer} dir="rtl">
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>لا توجد سجلات أشخاص حتى الآن</p>
          <p className={styles.emptyDescription}>
            ابدأ بإضافة أول شخص ليظهر هنا مع إمكانية فتح ملفه داخل نافذة جانبية سريعة.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer} dir="rtl">
      <table className={styles.table}>
        <thead className={styles.tableHead}>
          <tr>
            <th>الرقم القومي</th>
            <th>الاسم</th>
            <th>كود النظام</th>
            <th>رقم الموبايل</th>
            <th>تاريخ التسجيل</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {people.map((person) => (
            <tr key={person.id} className={styles.row}>
              <td className={`${styles.cell} ${styles.numericCell}`} dir="ltr">
                {person.national_id}
              </td>
              <td className={`${styles.cell} ${styles.nameCell}`}>
                <div className={styles.namePrimary}>
                  {person.first_name} {person.second_name} {person.third_name} {person.last_name}
                </div>
                <div className={styles.nameMeta}>ملف شخصي قابل للفتح داخل نفس السياق</div>
              </td>
              <td className={styles.cell}>
                <span className={`${styles.pill} ${styles.codePill}`}>{person.internal_code}</span>
              </td>
              <td
                className={`${styles.cell} ${styles.numericCell} ${styles.mutedValue}`}
                dir="ltr"
              >
                {person.phone_number || '-'}
              </td>
              <td
                className={`${styles.cell} ${styles.numericCell} ${styles.mutedValue}`}
                dir="ltr"
              >
                {new Date(person.created_at).toLocaleDateString('en-GB')}
              </td>
              <td className={`${styles.cell} ${styles.actionCell}`}>
                <Link
                  href={appendReturnTo(`/system/people/${person.id}`, returnTo)}
                  prefetch={true}
                  className={styles.actionLink}
                >
                  فتح الملف
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
