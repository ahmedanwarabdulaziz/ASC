import Link from 'next/link';
import type { MembershipRecord } from '@/server/actions/memberships/get-memberships';
import { appendReturnTo } from '@/lib/utils/return-to';
import styles from './memberships-table.module.css';

interface MembershipsTableProps {
  memberships: MembershipRecord[];
  returnTo?: string;
}

export function MembershipsTable({ memberships, returnTo }: MembershipsTableProps) {
  if (!memberships || memberships.length === 0) {
    return (
      <div className={styles.tableContainer} dir="rtl">
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>لا توجد عضويات مسجلة حالياً</p>
          <p className={styles.emptyDescription}>
            عند إصدار أول عضوية ستظهر هنا مع إمكانية فتح الملف وإضافة التابعين من دون مغادرة
            الصفحة.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer} dir="rtl">
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>رقم العضوية</th>
            <th className={styles.th}>العضو الأساسي</th>
            <th className={styles.th}>الرقم القومي</th>
            <th className={styles.th}>النوع</th>
            <th className={styles.th}>الحالة</th>
            <th className={styles.th}>تاريخ الإنشاء</th>
            <th className={styles.th}>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {memberships.map((membership) => {
            const currentNumberInfo = membership.membership_number_registry?.find(
              (numberRecord) => numberRecord.is_current
            );
            const membershipNumber = currentNumberInfo
              ? currentNumberInfo.membership_number
              : 'N/A';
            const fullName = membership.people
              ? `${membership.people.first_name} ${membership.people.second_name} ${membership.people.third_name} ${membership.people.last_name}`
              : 'Unknown';
            const nationalId = membership.people?.national_id || 'Unknown';
            const createdDate = new Date(membership.created_at).toLocaleDateString('en-GB', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <tr key={membership.id} className={styles.tr}>
                <td className={`${styles.td} ${styles.numericCell}`} dir="ltr">
                  {membershipNumber}
                </td>
                <td className={styles.td}>
                  <div className={styles.namePrimary}>{fullName}</div>
                  <div className={styles.nameMeta}>ملف عضوية قابل للفتح من نفس الشاشة</div>
                </td>
                <td className={`${styles.td} ${styles.numericCell}`} dir="ltr">
                  {nationalId}
                </td>
                <td className={styles.td}>عاملة</td>
                <td className={styles.td}>
                  <span
                    className={`${styles.badge} ${
                      membership.status !== 'active' ? styles.badgeArchived : ''
                    }`}
                  >
                    {membership.status === 'active' ? 'نشطة' : membership.status}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.numericCell}`} dir="ltr">
                  {createdDate}
                </td>
                <td className={styles.td}>
                  <Link
                    href={appendReturnTo(`/system/memberships/${membership.id}`, returnTo)}
                    prefetch={true}
                    className={styles.actionLink}
                  >
                    فتح الملف
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
