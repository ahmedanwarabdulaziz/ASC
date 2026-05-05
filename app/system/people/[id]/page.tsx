import Link from 'next/link';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { getPersonDetails } from '@/server/actions/people/get-person-details';
import { appendReturnTo, resolveReturnTo } from '@/lib/utils/return-to';
import workspace from '@/features/system/components/workspace.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return {
    title: `تفاصيل الشخص | ${id}`,
  };
}

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
  isModal?: boolean;
};

export default async function PersonDetailsPage({
  params,
  searchParams,
  isModal = false,
}: Props) {
  await requirePermission(PERMISSIONS.PEOPLE_READ);

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const parentReturnTo = resolveReturnTo(resolvedSearchParams?.returnTo, '/system/people');
  const currentPageHref = appendReturnTo(`/system/people/${id}`, parentReturnTo);
  const { success, data, error } = await getPersonDetails(id);

  if (!success || !data) {
    return (
      <div style={{ padding: '2rem', color: '#991b1b', direction: 'rtl' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>تعذر تحميل بيانات الشخص</h2>
        <p>{error || 'Person not found'}</p>
      </div>
    );
  }

  const { person, memberships } = data;
  const fullName = `${person.first_name} ${person.second_name} ${person.third_name} ${person.last_name}`;

  return (
    <div className={workspace.detailPage} dir="rtl">
      {!isModal && (
        <div className={workspace.breadcrumb}>
          <Link href={parentReturnTo} className={workspace.breadcrumbLink}>
            الأشخاص
          </Link>
          <span style={{ color: '#cbd5e1' }}>/</span>
          <span className={workspace.breadcrumbCurrent}>{fullName}</span>
        </div>
      )}

      <section className={workspace.surface}>
        <div className={workspace.contentBlock}>
          <div className={workspace.detailHeader}>
            <div>
              <h1 className={workspace.detailTitle}>{fullName}</h1>
              <p className={workspace.detailSubtitle}>
                كود النظام: <strong dir="ltr">{person.internal_code}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span className={`${workspace.statusPill} ${workspace.statusNeutral}`}>
                {memberships.length} عضوية مرتبطة
              </span>
              <Link
                href={appendReturnTo(`/system/people/${id}/edit`, currentPageHref)}
                className={workspace.secondaryAction}
                prefetch={true}
              >
                تعديل البيانات
              </Link>
            </div>
          </div>

          <div className={workspace.metaGrid}>
            <InfoCard label="الرقم القومي" value={person.national_id} dir="ltr" />
            <InfoCard label="رقم الموبايل" value={person.phone_number || '-'} dir="ltr" />
            <InfoCard label="رقم الطوارئ" value={person.emergency_contact || '-'} dir="ltr" />
            <InfoCard
              label="تاريخ التسجيل"
              value={new Date(person.created_at).toLocaleDateString('en-GB')}
              dir="ltr"
            />
          </div>
        </div>
      </section>

      <section className={workspace.surface}>
        <div className={workspace.contentBlock}>
          <div className={workspace.sectionHeader}>
            <div>
              <h2 className={workspace.sectionTitle}>العضويات العاملة</h2>
              <p className={workspace.sectionDescription}>
                كل العضويات المرتبطة بهذا الشخص كعضو أساسي مع انتقال سريع إلى ملف كل عضوية.
              </p>
            </div>
          </div>

          {memberships.length === 0 ? (
            <div className={workspace.emptyState}>
              لا توجد عضويات عاملة مسجلة لهذا الشخص حالياً.
            </div>
          ) : (
            <div className={workspace.listStack}>
              {memberships.map((membership) => (
                <div key={membership.id} className={workspace.listItem}>
                  <div>
                    <div className={workspace.listItemTitle}>
                      رقم العضوية <span dir="ltr">{membership.membership_number}</span>
                    </div>
                    <div className={workspace.listItemSub}>
                      تم الإنشاء في{' '}
                      <span dir="ltr">
                        {new Date(membership.created_at).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </div>

                  <div className={workspace.toolbarActions}>
                    <span
                      className={`${workspace.statusPill} ${
                        membership.status === 'active'
                          ? workspace.statusActive
                          : workspace.statusNeutral
                      }`}
                    >
                      {membership.status === 'active' ? 'نشطة' : membership.status}
                    </span>
                    <Link
                      href={appendReturnTo(`/system/memberships/${membership.id}`, currentPageHref)}
                      className={workspace.secondaryAction}
                    >
                      فتح ملف العضوية
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
