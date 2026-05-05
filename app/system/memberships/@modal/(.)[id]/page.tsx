import MembershipDetailsPage from '@/app/system/memberships/[id]/page';
import { MembershipDetailsModalInterceptor } from '@/features/memberships/components/membership-details-modal-interceptor';

export default async function InterceptedMembershipDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  return (
    <MembershipDetailsModalInterceptor>
      <MembershipDetailsPage params={params} searchParams={searchParams} isModal={true} />
    </MembershipDetailsModalInterceptor>
  );
}
