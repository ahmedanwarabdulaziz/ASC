'use client';

import { RouteModal } from '@/features/system/components/route-modal';

export function MembershipDetailsModalInterceptor({ children }: { children: React.ReactNode }) {
  return (
    <RouteModal variant="drawer" maxWidth="920px">
      {children}
    </RouteModal>
  );
}
