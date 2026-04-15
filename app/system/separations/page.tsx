import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/formatters'
import SeparationActionsWidgets from './SeparationActionsWidgets'

export const dynamic = 'force-dynamic'

export default async function SeparationsHubPage() {
  const supabase = await createClient()

  // Fetch pending separation requests with relation details
  const { data: requests, error } = await supabase
    .from('membership_separation_requests')
    .select(`
      id,
      status,
      notes,
      created_at,
      board_decision_number,
      board_meeting_date,
      membership_member:membership_members (
        relationship,
        membership:memberships ( membership_number, type ),
        person:people ( first_name, last_name, national_id )
      )
    `)
    .not('status', 'eq', 'completed')
    .order('created_at', { ascending: true })

  if (error) {
    console.error(error)
  }

  const statusMap: Record<string, any> = {
    'draft': { label: 'قيد الانتظار (إدارياً)', color: '#yelllow' },
    'admin_approved': { label: 'موافقة إدارية تمت (بانتظار المجلس)', color: '#blue' },
    'board_approved': { label: 'موافقة المجلس تمت (بانتظار السداد)', color: '#purple' },
    'payment_confirmed': { label: 'تم السداد (بانتظار الإصدار)', color: '#teal' }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">طلبات الفصل (التحويل لعضو عامل)</h1>
        <p style={{ color: 'var(--text-muted)' }}>لوحة تحكم إدارية لمتابعة واعتماد طلبات الاستقلال العائلي.</p>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>تاريخ الطلب</th>
              <th>بيانات التابع (طالب الفصل)</th>
              <th>رقم العضوية الأساسية</th>
              <th>الحالة الحالية</th>
              <th>إجراءات إدارية</th>
            </tr>
          </thead>
          <tbody>
            {(requests || []).map((req: Record<string, unknown>) => {
              const member = Array.isArray(req.membership_member) ? req.membership_member[0] : req.membership_member;
              const person = Array.isArray(member?.person) ? member.person[0] : member?.person;
              const originalMembership = Array.isArray(member?.membership) ? member.membership[0] : member?.membership;

              return (
                <tr key={req.id}>
                  <td dir="ltr" style={{ textAlign: 'right' }}>{formatDate(req.created_at)}</td>
                  <td>
                     <strong>{person?.first_name} {person?.last_name}</strong><br/>
                     <span style={{ fontSize: '0.85rem', color: '#64748b' }} dir="ltr">{person?.national_id}</span>
                  </td>
                  <td>
                     <Link href={`/system/memberships/${originalMembership?.id}`}>
                       <strong dir="ltr">{originalMembership?.membership_number}</strong>
                     </Link>
                  </td>
                  <td>
                    <span className="badge" style={{ border: '1px solid #cbd5e1' }}>
                       {statusMap[req.status]?.label || req.status}
                    </span>
                    {req.board_decision_number && (
                      <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        قرار: {req.board_decision_number}
                      </div>
                    )}
                  </td>
                  <td>
                    <SeparationActionsWidgets request={req} />
                  </td>
                </tr>
              )
            })}
            {requests?.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>لا توجد طلبات فصل قيد التنفيذ حالياً.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
