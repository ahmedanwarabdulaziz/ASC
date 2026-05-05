'use client';

import { RouteModal } from '@/features/system/components/route-modal';
import { AddMembershipForm } from './add-membership-form';

export function AddMembershipModalInterceptor() {
  return (
    <RouteModal variant="drawer" maxWidth="760px">
      <AddMembershipForm />
    </RouteModal>
  );
}
