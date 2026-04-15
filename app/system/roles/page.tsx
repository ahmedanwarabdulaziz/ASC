import { getRoleDefinitions } from '@/features/roles/actions'
import Link from 'next/link'
import DeleteRoleButton from '@/components/roles/DeleteRoleButton'

export default async function RolesPage() {
  const roles = await getRoleDefinitions()

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <h1 className="page-title">إعدادات الأدوار | Role Settings</h1>
        <Link href="/system/roles/new" className="btn btn-primary">
          إضافة دور جديد | Add Role
        </Link>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>الاسم (عربي) | Name AR</th>
              <th>الكود (مرجع) | Code Ref</th>
              <th>إجراءات | Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <td style={{ fontWeight: 600 }}>{role.name_ar}</td>
                <td dir="ltr" style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {role.code}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Link href={`/system/roles/${role.id}`} className="btn btn-sm btn-primary">إعداد الحقول</Link>
                    
                    <Link href={`/system/roles/${role.id}/edit`} className="icon-btn" title="تعديل الاسم">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Link>

                    <DeleteRoleButton id={role.id} />
                  </div>
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
                  لا يوجد أدوار مسجلة حالياً | No role definitions
                  <br />
                  <br />
                  <Link href="/system/roles/new" className="btn btn-sm btn-primary">إنشاء الدور الأول | Create First Role</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
