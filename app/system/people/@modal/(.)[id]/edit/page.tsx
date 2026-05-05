import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { getPersonDetails } from '@/server/actions/people/get-person-details';
import { EditPersonModalInterceptor } from '@/features/people/components/edit-person-modal-interceptor';
import { notFound } from 'next/navigation';

export default async function EditPersonModalPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.PEOPLE_UPDATE);
  
  const { id } = await params;
  const { success, data } = await getPersonDetails(id);

  if (!success || !data) {
    return notFound();
  }

  return <EditPersonModalInterceptor person={data.person} />;
}
