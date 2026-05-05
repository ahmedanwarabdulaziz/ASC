import Link from 'next/link';
import { getStaffList } from '@/server/actions/staff/get-staff';
import { StaffTable } from '@/features/staff/components/staff-table';
import { appendReturnTo } from '@/lib/utils/return-to';
import workspace from '@/features/system/components/workspace.module.css';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const returnTo = typeof resolvedSearchParams.returnTo === 'string' ? resolvedSearchParams.returnTo : '/system/staff';
  
  const { data: staffList, error } = await getStaffList();

  return (
    <div className={workspace.page} dir="rtl">
      <section className={workspace.hero}>
        <div className={workspace.heroRow}>
          <div>
            <span className={workspace.eyebrow}>Staff Management</span>
            <h1 className={workspace.title}>إدارة الموظفين</h1>
            <p className={workspace.description}>
              مساحة عمل لإدارة بيانات الموظفين، الأقسام، والصلاحيات التشغيلية الخاصة بهم.
            </p>
          </div>
        </div>
      </section>

      <section className={workspace.toolbar}>
        <div className={workspace.searchSlot}>
          {/* Add search later if needed */}
        </div>

        <div className={workspace.toolbarActions}>
          <Link
            href={appendReturnTo('/system/staff/settings', returnTo)}
            className={workspace.secondaryAction}
            style={{ padding: '0.75rem 1.5rem', background: '#f8fafc', color: '#1e452b', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 500, textDecoration: 'none' }}
          >
            إعدادات الموظفين
          </Link>
          <Link
            href={appendReturnTo('/system/staff/new', returnTo)}
            prefetch={true}
            className={workspace.primaryAction}
          >
            <span>إضافة موظف</span>
            <span aria-hidden="true">+</span>
          </Link>
        </div>
      </section>

      <section className={`${workspace.surface} ${workspace.tableSurface}`}>
        {error ? (
          <div style={{ padding: '2rem', color: '#ef4444' }}>{error}</div>
        ) : (
          <Suspense fallback={<div style={{ padding: '2rem' }}>جاري التحميل...</div>}>
            <StaffTable staffList={staffList || []} returnTo={returnTo} />
          </Suspense>
        )}
      </section>
    </div>
  );
}
