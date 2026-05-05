import Link from 'next/link';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { getMembershipDetails } from '@/server/actions/memberships/get-membership-details';
import { DependentsTable } from '@/features/memberships/components/dependents-table';
import { appendReturnTo, resolveReturnTo } from '@/lib/utils/return-to';
import workspace from '@/features/system/components/workspace.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return { title: 'تفاصيل العضوية | Membership Details' };
}

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
  isModal?: boolean;
};

export default async function MembershipDetailsPage({
  params,
  searchParams,
  isModal = false,
}: Props) {
  await requirePermission(PERMISSIONS.MEMBERSHIPS_READ);

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const parentReturnTo = resolveReturnTo(
    resolvedSearchParams?.returnTo,
    '/system/memberships'
  );
  const currentPageHref = appendReturnTo(`/system/memberships/${id}`, parentReturnTo);
  const { success, data: membership, error } = await getMembershipDetails(id);

  if (!success || !membership) {
    return (
      <div style={{ padding: '2rem', color: 'red', direction: 'rtl' }}>
        <h2>خطأ في تحميل العضوية</h2>
        <p>{error || 'Membership not found'}</p>
      </div>
    );
  }

  const mainPersonName = `${membership.main_person.first_name} ${membership.main_person.second_name} ${membership.main_person.third_name} ${membership.main_person.last_name}`;

  return (
    <div className={workspace.detailPage} dir="rtl">
      {!isModal && (
        <div className={workspace.breadcrumb}>
          <Link href={parentReturnTo} className={workspace.breadcrumbLink}>
            العضويات
          </Link>
          <span style={{ color: '#cbd5e1' }}>/</span>
          <span className={workspace.breadcrumbCurrent}>
            رقم <span dir="ltr">{membership.membership_number}</span>
          </span>
        </div>
      )}

      <section className={workspace.surface}>
        <div className={workspace.contentBlock}>
          <div className={workspace.detailHeader}>
            <div>
              <h1 className={workspace.detailTitle}>{mainPersonName}</h1>
              <p className={workspace.detailSubtitle}>
                رقم العضوية: <strong dir="ltr">{membership.membership_number}</strong> | الرقم
                القومي: <strong dir="ltr">{membership.main_person.national_id}</strong>
              </p>
            </div>

            <div className={workspace.toolbarActions}>
              <span
                className={`${workspace.statusPill} ${
                  membership.status === 'active'
                    ? workspace.statusActive
                    : workspace.statusNeutral
                }`}
              >
                {membership.status === 'active' ? 'عضوية نشطة' : membership.status}
              </span>
              <Link
                href={appendReturnTo(
                  `/system/memberships/${id}/dependents/new`,
                  currentPageHref
                )}
                prefetch={true}
                className={workspace.primaryAction}
              >
                <span>إضافة تابع</span>
                <span aria-hidden="true">+</span>
              </Link>
            </div>
          </div>

          <div className={workspace.metaGrid}>
            <InfoCard label="رقم العضوية" value={membership.membership_number} dir="ltr" />
            <InfoCard label="الرقم القومي" value={membership.main_person.national_id} dir="ltr" />
            <InfoCard
              label="رقم الموبايل"
              value={membership.main_person.phone_number || '-'}
              dir="ltr"
            />
            <InfoCard
              label="تاريخ الإنشاء"
              value={new Date(membership.created_at).toLocaleDateString('en-GB')}
              dir="ltr"
            />
            <InfoCard label="عدد التابعين" value={String(membership.dependents.length)} />
            <InfoCard label="نوع العضوية" value="عاملة" />
          </div>
        </div>
      </section>

      <section className={`${workspace.surface} ${workspace.tableSurface}`}>
        <div className={workspace.contentBlock}>
          <div className={workspace.sectionHeader}>
            <div>
              <h2 className={workspace.sectionTitle}>التابعون</h2>
              <p className={workspace.sectionDescription}>
                عرض جميع التابعين المسجلين لهذه العضوية مع إبقاء الإضافة داخل نفس سياق الملف.
              </p>
            </div>
          </div>
        </div>
        <DependentsTable dependents={membership.dependents} />
      </section>
    </div>
  );
}

function InfoCard({
  label,
  value,
  dir,
}: {
  label: string;
  value: string;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <div className={workspace.metaCard}>
      <div className={workspace.metaLabel}>{label}</div>
      <div className={workspace.metaValue} dir={dir}>
        {value}
      </div>
    </div>
  );
}
