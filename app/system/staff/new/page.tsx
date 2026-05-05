import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { getStaffOptions } from '@/server/actions/staff/get-staff-options';
import { AddStaffForm } from '@/features/staff/components/add-staff-form';
import workspace from '@/features/system/components/workspace.module.css';

export default async function AddStaffPage() {
  await requirePermission(PERMISSIONS.STAFF_CREATE);
  const { jobs, groups } = await getStaffOptions();

  return (
    <div className={workspace.page} dir="rtl">
      <section className={workspace.surface}>
        <AddStaffForm jobs={jobs || []} groups={groups || []} />
      </section>
    </div>
  );
}
