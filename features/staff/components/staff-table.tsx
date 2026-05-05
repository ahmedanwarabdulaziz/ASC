import Link from 'next/link';
import { appendReturnTo } from '@/lib/utils/return-to';
import styles from '@/features/people/components/people-table.module.css';

interface StaffTableProps {
  staffList: any[];
  returnTo?: string;
}

export function StaffTable({ staffList, returnTo }: StaffTableProps) {
  if (!staffList || staffList.length === 0) {
    return (
      <div className={styles.tableContainer} dir="rtl">
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>لا يوجد موظفين حتى الآن</p>
          <p className={styles.emptyDescription}>
            قم بإضافة موظفين من زر "إضافة موظف".
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
            <th>الاسم</th>
            <th>الرقم القومي</th>
            <th>كود الموظف</th>
            <th>القسم (الفئة)</th>
            <th>الوظيفة</th>
            <th>حالة العمل</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {staffList.map((staff) => (
            <tr key={staff.id} className={styles.row}>
              <td className={`${styles.cell} ${styles.nameCell}`}>
                <div className={styles.namePrimary}>
                  {staff.person?.first_name} {staff.person?.second_name} {staff.person?.third_name} {staff.person?.last_name}
                </div>
              </td>
              <td className={`${styles.cell} ${styles.numericCell}`} dir="ltr">
                {staff.person?.national_id}
              </td>
              <td className={styles.cell}>
                <span className={`${styles.pill} ${styles.codePill}`}>{staff.staff_code || '-'}</span>
              </td>
              <td className={styles.cell}>
                {staff.job?.category?.name || '-'}
                {staff.job?.subcategory ? ` / ${staff.job.subcategory.name}` : ''}
              </td>
              <td className={styles.cell}>
                {staff.job?.name || '-'}
              </td>
              <td className={styles.cell}>
                {staff.status === 'active' ? (
                  <span className={`${styles.pill} ${styles.statusPillActive}`} style={{color: '#1e452b', background: '#d1f0db', padding: '2px 8px', borderRadius: '4px'}}>نشط</span>
                ) : staff.status === 'suspended' ? (
                  <span className={`${styles.pill} ${styles.statusPillSuspended}`} style={{color: '#8a6d3b', background: '#fcf8e3', padding: '2px 8px', borderRadius: '4px'}}>موقوف</span>
                ) : (
                  <span className={`${styles.pill} ${styles.statusPillEnded}`} style={{color: '#a94442', background: '#f2dede', padding: '2px 8px', borderRadius: '4px'}}>منتهي</span>
                )}
              </td>
              <td className={`${styles.cell} ${styles.actionCell}`}>
                <Link
                  href={appendReturnTo(`/system/staff/${staff.id}/edit`, returnTo)}
                  prefetch={true}
                  className={styles.actionLink}
                >
                  تعديل
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
