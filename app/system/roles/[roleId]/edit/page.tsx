import { getRoleById } from '@/features/roles/actions'
import { notFound } from 'next/navigation'
import EditRoleFormClient from './EditRoleFormClient'

export default async function EditRolePage({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params
  const role = await getRoleById(roleId)
  
  if (!role) {
    return notFound()
  }

  return (
    <div className="page-container" style={{ maxWidth: '600px' }}>
      <div className="page-header flex-between" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">تعديل التسمية</h1>
      </div>
      
      <EditRoleFormClient role={role} />
    </div>
  )
}
