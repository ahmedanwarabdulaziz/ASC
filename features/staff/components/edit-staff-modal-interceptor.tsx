'use client';

import { RouteModal } from '@/features/system/components/route-modal';
import { EditStaffForm } from './edit-staff-form';

interface EditStaffModalInterceptorProps {
  staffMember: any;
  jobs: any[];
  groups: any[];
}

export function EditStaffModalInterceptor({ staffMember, jobs, groups }: EditStaffModalInterceptorProps) {
  return (
    <RouteModal title="تعديل موظف">
      <EditStaffForm staffMember={staffMember} jobs={jobs} groups={groups} />
    </RouteModal>
  );
}
