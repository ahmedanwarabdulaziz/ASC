'use client';

import { RouteModal } from '@/features/system/components/route-modal';
import { AddPersonForm } from './add-person-form';

export function AddPersonModalInterceptor() {
  return (
    <RouteModal variant="drawer" maxWidth="720px">
      <AddPersonForm />
    </RouteModal>
  );
}
