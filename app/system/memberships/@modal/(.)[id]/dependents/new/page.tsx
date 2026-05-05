import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { AddDependentModalInterceptor } from '@/features/memberships/components/add-dependent-modal-interceptor';

export default async function AddDependentModalPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.MEMBERSHIPS_ADD_DEPENDENT);
  
  const { id } = await params;
  return <AddDependentModalInterceptor membershipId={id} />;
}
