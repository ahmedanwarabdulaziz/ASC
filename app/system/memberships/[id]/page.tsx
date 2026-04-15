import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DeleteDependentBtn from '@/components/memberships/DeleteDependentBtn'
import { formatDate } from '@/lib/utils/formatters'

export default async function MembershipHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: ms } = await supabase.from('memberships').select('*').eq('id', id).single()
  if (!ms) return notFound()

  const { data: family } = await supabase
    .from('membership_members')
    .select(`
      id,
      relationship,
      card_status,
      added_at,
      person:people (
        first_name,
        last_name,
        national_id,
        birth_date,
        gender
      )
    `)
    .eq('membership_id', id)
    .order('added_at', { ascending: true })

  const relLabels: Record<string, string> = {
    'principal': 'العضو الرئيسي (رب الأسرة)',
    'wife': 'زوجة',
    'husband': 'زوج',
    'son': 'إبن',
    'daughter': 'إبنة'
  }

  const typeLabels: Record<string, string> = {
    'working': 'عاملة',
    'sports': 'رياضية',
    'affiliate': 'تابعة'
  }

  return (
    <div className="page-container">
      <div className="page-header flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
            رقم العضوية: <span dir="ltr">{ms.membership_number}</span>
          </h1>
          <span style={{ color: 'var(--text-muted)' }}>
            عضوية {typeLabels[ms.type] || ms.type} | مسجلة في {formatDate(ms.join_date)}
          </span>
        </div>
        <Link href="/system/memberships" className="btn" style={{ background: '#e2e8f0', color: '#0f172a' }}>
          عودة للسجل العام
        </Link>
      </div>

      <div className="table-container" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: '#1e3a5f', color: 'white' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>شجرة العضوية (الأسرة) | Family Tree</span>
            <Link href={`/system/memberships/${id}/add-dependent`} className="btn btn-sm" style={{ background: 'white', color: 'var(--primary)', padding: '0.5rem 1rem' }}>
              إضافة فرد تابع +
            </Link>
          </h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>الصلة التشريحية</th>
              <th>الاسم الكامل</th>
              <th>الرقم القومي</th>
              <th>تاريخ الميلاد</th>
              <th>حالة البطاقة/الكارنيه</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {(family || []).map((member: any) => {
              const person = Array.isArray(member.person) ? member.person[0] : member.person;
              return (
                <tr key={member.id}>
                  <td style={{ fontWeight: member.relationship === 'principal' ? 'bold' : 'normal', color: member.relationship === 'principal' ? 'var(--primary)' : 'inherit' }}>
                    {relLabels[member.relationship] || member.relationship}
                  </td>
                  <td style={{ fontWeight: 600 }}>{person?.first_name} {person?.last_name}</td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>{person?.national_id}</td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>{formatDate(person?.birth_date) || 'غير محدد'}</td>
                  <td>
                    <span className="badge" style={{ background: member.card_status === 'active' ? '#dcfce7' : '#f1f5f9', color: member.card_status === 'active' ? '#166534' : '#475569' }}>
                      {member.card_status === 'active' ? 'مفعل (Active)' : member.card_status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button className="icon-btn" title="تعديل" style={{ background: 'transparent', border: 'none' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <DeleteDependentBtn linkId={member.id} membershipId={id} isPrincipal={member.relationship === 'principal'} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
  )
}
