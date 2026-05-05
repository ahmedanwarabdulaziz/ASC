import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import PeoplePage from '@/app/system/people/page';
import { AddPersonModalInterceptor } from '@/features/people/components/add-person-modal-interceptor';
import { resolveReturnTo } from '@/lib/utils/return-to';

export const metadata = {
  title: 'إضافة شخص | Add Person',
};

type SearchParams = {
  search?: string;
  page?: string;
  returnTo?: string;
};

export default async function NewPersonPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission(PERMISSIONS.PEOPLE_CREATE);

  const resolvedSearchParams = await searchParams;
  const returnTo = resolveReturnTo(resolvedSearchParams.returnTo, '/system/people');
  const parentSearchParams = getPeopleSearchParams(returnTo);

  return (
    <>
      <PeoplePage searchParams={Promise.resolve(parentSearchParams)} />
      <AddPersonModalInterceptor />
    </>
  );
}

function getPeopleSearchParams(returnTo: string): Pick<SearchParams, 'search' | 'page'> {
  const url = new URL(returnTo, 'http://localhost');

  if (url.pathname !== '/system/people') {
    return {};
  }

  return {
    search: url.searchParams.get('search') || undefined,
    page: url.searchParams.get('page') || undefined,
  };
}
