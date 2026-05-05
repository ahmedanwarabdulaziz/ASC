import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { AddMembershipModalInterceptor } from '@/features/memberships/components/add-membership-modal-interceptor';

export default async function AddMembershipModalPage() {
  await requirePermission(PERMISSIONS.MEMBERSHIPS_CREATE);
  
  return <AddMembershipModalInterceptor />;
}
