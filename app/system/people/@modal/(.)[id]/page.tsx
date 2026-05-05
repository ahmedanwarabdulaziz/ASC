import PersonDetailsPage from '@/app/system/people/[id]/page';
import { RouteModal } from '@/features/system/components/route-modal';

export default async function InterceptedPersonDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  return (
    <RouteModal variant="drawer" maxWidth="920px">
      <PersonDetailsPage params={params} searchParams={searchParams} isModal={true} />
    </RouteModal>
  );
}
