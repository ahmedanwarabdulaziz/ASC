import { getRoleById, getRoleFields } from '@/features/roles/actions'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import CreateFieldForm from '@/components/roles/CreateFieldForm'

export default async function RoleDetailsPage({ params }: { params: Promise<{ roleId: string }> }) {
  // Await the params resolution for Next 15 Dynamic APIs
  const { roleId } = await params
  
  const [role, fields] = await Promise.all([
    getRoleById(roleId),
    getRoleFields(roleId)
  ])

  if (!role) {
    return notFound()
  }

  // Type labels for display
  const fieldTypeLabels: Record<string, string> = {
    'text': 'نص قصير',
    'number': 'رقم',
    'date': 'تاريخ',
    'boolean': 'خانة اختيار (نعم/لا)',
    'select': 'قائمة خيارات'
  }

  return (
    <div className="page-container">
      <div className="page-header flex-between" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="page-title">{role.name_ar}</h1>
          <span style={{ color: 'var(--text-muted)' }} dir="ltr">{role.code}</span>
        </div>
        <Link href="/system/roles" className="btn" style={{ background: '#e2e8f0', color: '#0f172a' }}>
          عودة للقائمة | Back
        </Link>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>
        
        {/* Fields List */}
        <div className="table-container">
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>هيكل البيانات (الحقول المطلوبة من العضو)</h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>اسم الحقل</th>
                <th>النوع</th>
                <th>الإلزامية</th>
                <th>خصائص</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field.id}>
                  <td style={{ fontWeight: 600 }}>{field.name_ar}</td>
                  <td>{fieldTypeLabels[field.field_type] || field.field_type}</td>
                  <td>
                    {field.is_required ? (
                      <span className="badge" style={{ background: '#fef2f2', color: '#ef4444', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.8rem' }}>إلزامي</span>
                    ) : (
                      <span className="badge" style={{ background: '#f1f5f9', color: '#64748b', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.8rem' }}>اختياري</span>
                    )}
                  </td>
                  <td>
                    {field.field_type === 'select' && field.list_options ? (
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {(field.list_options as string[]).map((opt, i) => (
                          <span key={i} style={{ background: 'var(--primary)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                            {opt}
                          </span>
                        ))}
                      </div>
                    ) : '-'}
                  </td>
                </tr>
              ))}
              {fields.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center" style={{ padding: '4rem', color: 'var(--text-muted)' }}>
                    لم يتم إضافة أي حقول ديناميكية لهذا الدور حتى الآن.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Field Form */}
        <CreateFieldForm roleId={role.id} />
        
      </div>
    </div>
  )
}
