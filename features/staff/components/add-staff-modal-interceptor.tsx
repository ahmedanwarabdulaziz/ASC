'use client';

import { RouteModal } from '@/features/system/components/route-modal';
import { AddStaffForm } from './add-staff-form';

interface AddStaffModalInterceptorProps {
  jobs: any[];
  groups: any[];
}

export function AddStaffModalInterceptor({ jobs, groups }: AddStaffModalInterceptorProps) {
  return (
    <RouteModal title="إضافة موظف">
      <AddStaffForm jobs={jobs} groups={groups} />
    </RouteModal>
  );
}
