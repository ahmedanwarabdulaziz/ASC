import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { getStaffOptions } from '@/server/actions/staff/get-staff-options';
import { getStaffById } from '@/server/actions/staff/get-staff';
import { EditStaffForm } from '@/features/staff/components/edit-staff-form';
import workspace from '@/features/system/components/workspace.module.css';
import { notFound } from 'next/navigation';

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.STAFF_UPDATE);
  
  const { id } = await params;
  const [staffRes, optionsRes] = await Promise.all([
    getStaffById(id),
    getStaffOptions()
  ]);

  if (!staffRes.success || !staffRes.data) {
    return notFound();
  }

  return (
    <div className={workspace.page} dir="rtl">
      <section className={workspace.surface}>
        <EditStaffForm 
          staffMember={staffRes.data} 
          jobs={optionsRes.jobs || []} 
          groups={optionsRes.groups || []} 
        />
      </section>
    </div>
  );
}
