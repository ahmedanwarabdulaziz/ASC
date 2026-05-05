import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { getStaffOptions } from '@/server/actions/staff/get-staff-options';
import { getStaffById } from '@/server/actions/staff/get-staff';
import { EditStaffModalInterceptor } from '@/features/staff/components/edit-staff-modal-interceptor';
import { notFound } from 'next/navigation';

export default async function EditStaffModalPage({ params }: { params: Promise<{ id: string }> }) {
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
    <EditStaffModalInterceptor 
      staffMember={staffRes.data} 
      jobs={optionsRes.jobs || []} 
      groups={optionsRes.groups || []} 
    />
  );
}
