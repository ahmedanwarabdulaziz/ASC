import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { getPersonDetails } from '@/server/actions/people/get-person-details';
import { EditPersonForm } from '@/features/people/components/edit-person-form';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'تعديل بيانات الشخص | Edit Person',
};

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.PEOPLE_UPDATE);
  
  const { id } = await params;
  const { success, data, error } = await getPersonDetails(id);

  if (!success || !data) {
    return (
      <div style={{ padding: '2rem', color: '#991b1b', direction: 'rtl' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>تعذر تحميل بيانات الشخص</h2>
        <p>{error || 'Person not found'}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <EditPersonForm person={data.person} />
    </div>
  );
}
