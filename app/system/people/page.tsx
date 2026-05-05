import Link from 'next/link';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { getPeople } from '@/server/actions/people/get-people';
import { PeopleTable } from '@/features/people/components/people-table';
import { SearchInput } from '@/features/people/components/search-input';
import { PaginationControls } from '@/features/people/components/pagination-controls';
import { appendReturnTo } from '@/lib/utils/return-to';
import workspace from '@/features/system/components/workspace.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'الأشخاص | People',
};

export default async function PeoplePage(props: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  await requirePermission(PERMISSIONS.PEOPLE_READ);

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

  const currentPath = params.toString() ? `/system/people?${params.toString()}` : '/system/people';
  const { data: people, total } = await getPeople({ search, page, limit });

  return (
    <div className={workspace.page}>
      <section className={workspace.hero}>
        <div className={workspace.heroRow}>
          <div>
            <span className={workspace.eyebrow}>People Registry</span>
            <h1 className={workspace.title}>سجل الأشخاص</h1>
            <p className={workspace.description}>
              مساحة عمل واضحة لإدارة الأشخاص المسجلين وربطهم لاحقاً بالعضويات والملفات التابعة بدون فقدان السياق.
            </p>
          </div>

          <div className={workspace.heroAside}>
            <div className={workspace.heroStat}>
              <span className={workspace.heroStatValue}>{total}</span>
              <span className={workspace.heroStatLabel}>إجمالي السجلات</span>
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
            href={appendReturnTo('/system/people/new', currentPath)}
            prefetch={true}
            className={workspace.primaryAction}
          >
            <span>إضافة شخص</span>
            <span aria-hidden="true">+</span>
          </Link>
        </div>
      </section>

      <section className={`${workspace.surface} ${workspace.tableSurface}`}>
        <PeopleTable people={people} returnTo={currentPath} />
      </section>

      <PaginationControls totalRecords={total} currentPage={page} limit={limit} />
    </div>
  );
}
