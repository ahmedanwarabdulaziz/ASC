import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import MembershipDetailsPage from '@/app/system/memberships/[id]/page';
import { AddDependentModalInterceptor } from '@/features/memberships/components/add-dependent-modal-interceptor';
import { resolveReturnTo } from '@/lib/utils/return-to';

export const metadata = {
  title: 'إضافة تابع | Add Dependent',
};

export default async function AddDependentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  await requirePermission(PERMISSIONS.MEMBERSHIPS_ADD_DEPENDENT);
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const returnTo = resolveReturnTo(resolvedSearchParams.returnTo, `/system/memberships/${id}`);

  return (
    <>
      <MembershipDetailsPage
        params={Promise.resolve({ id })}
        searchParams={Promise.resolve({ returnTo })}
      />
      <AddDependentModalInterceptor membershipId={id} />
    </>
  );
}
