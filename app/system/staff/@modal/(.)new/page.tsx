import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { getStaffOptions } from '@/server/actions/staff/get-staff-options';
import { AddStaffModalInterceptor } from '@/features/staff/components/add-staff-modal-interceptor';

export default async function AddStaffModalPage() {
  await requirePermission(PERMISSIONS.STAFF_CREATE);
  const { jobs, groups } = await getStaffOptions();

  return <AddStaffModalInterceptor jobs={jobs || []} groups={groups || []} />;
}
