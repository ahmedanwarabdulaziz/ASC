'use client';

import { RouteModal } from '@/features/system/components/route-modal';
import { AddDependentForm } from './add-dependent-form';

export function AddDependentModalInterceptor({ membershipId }: { membershipId: string }) {
  return (
    <RouteModal
      variant="drawer"
      maxWidth="760px"
      fallbackHref={`/system/memberships/${membershipId}`}
    >
      <AddDependentForm membershipId={membershipId} />
    </RouteModal>
  );
}
