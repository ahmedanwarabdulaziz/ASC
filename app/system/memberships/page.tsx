import Link from 'next/link';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { getMemberships } from '@/server/actions/memberships/get-memberships';
import { MembershipsTable } from '@/features/memberships/components/memberships-table';
import { SearchInput } from '@/features/people/components/search-input';
import { PaginationControls } from '@/features/people/components/pagination-controls';
import { appendReturnTo } from '@/lib/utils/return-to';
import workspace from '@/features/system/components/workspace.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'العضويات | Memberships',
};

export default async function MembershipsPage(props: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  await requirePermission(PERMISSIONS.MEMBERSHIPS_READ);

  const search = searchParams.search || '';
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 20;
  const params = new URLSearchParams();

  if (search) {
    params.set('search', search);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const currentPath = params.toString()
    ? `/system/memberships?${params.toString()}`
    : '/system/memberships';
  const { data: memberships, total } = await getMemberships({ search, page, limit });

  return (
    <div className={workspace.page} dir="rtl">
      <section className={workspace.hero}>
        <div className={workspace.heroRow}>
          <div>
            <span className={workspace.eyebrow}>Memberships Desk</span>
            <h1 className={workspace.title}>سجل العضويات</h1>
            <p className={workspace.description}>
              مساحة عمل موحدة لمتابعة العضويات العاملة والتنقل إلى ملفاتها وتوابعها بسرعة من
              دون فقدان سياق البحث أو الصفحة الحالية.
            </p>
          </div>

          <div className={workspace.heroAside}>
            <div className={workspace.heroStat}>
              <span className={workspace.heroStatValue}>{total}</span>
              <span className={workspace.heroStatLabel}>إجمالي العضويات</span>
            </div>
            <div className={workspace.heroStat}>
              <span className={workspace.heroStatValue}>{page}</span>
              <span className={workspace.heroStatLabel}>الصفحة الحالية</span>
            </div>
          </div>
        </div>
      </section>

      <section className={workspace.toolbar}>
        <div className={workspace.searchSlot}>
          <SearchInput />
        </div>

        <div className={workspace.toolbarActions}>
          <Link
            href={appendReturnTo('/system/memberships/new', currentPath)}
            prefetch={true}
            className={workspace.primaryAction}
          >
            <span>إصدار عضوية عاملة</span>
            <span aria-hidden="true">+</span>
          </Link>
        </div>
      </section>

      <section className={`${workspace.surface} ${workspace.tableSurface}`}>
        <MembershipsTable memberships={memberships} returnTo={currentPath} />
      </section>

      <PaginationControls totalRecords={total} currentPage={page} limit={limit} />
    </div>
  );
}
