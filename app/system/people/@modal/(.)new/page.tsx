import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { AddPersonModalInterceptor } from '@/features/people/components/add-person-modal-interceptor';

export default async function NewPersonModalPage() {
  await requirePermission(PERMISSIONS.PEOPLE_CREATE);

  return <AddPersonModalInterceptor />;
}
