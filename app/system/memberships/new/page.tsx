import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { AddMembershipForm } from '@/features/memberships/components/add-membership-form';

export const metadata = {
  title: 'إصدار عضوية عاملة | New Membership',
};

export default async function NewMembershipPage() {
  await requirePermission(PERMISSIONS.MEMBERSHIPS_CREATE);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
      <AddMembershipForm />
    </div>
  );
}
