import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DeleteMembershipBtn from '@/components/memberships/DeleteMembershipBtn'
import { formatDate } from '@/lib/utils/formatters'

export default async function MembershipsDashboard() {
  const supabase = await createClient()
  
  const { data: memberships, error } = await supabase
    .from('memberships')
    .select(`
      id,
      membership_number,
      type,
      status,
      join_date,
      main_person:people (
        first_name,
        last_name,
        national_id,
        phone_number
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Dashboard error:", error);
  }

  const typeLabels: Record<string, string> = {
    'working': 'عاملة (Working)',
    'sports': 'رياضية (Sports)',
    'affiliate': 'تابعة (Affiliate)'
  }

  const statusTags: Record<string, { label: string, bg: string, text: string }> = {
    'active': { label: 'ساري', bg: '#dcfce7', text: '#166534' },
    'suspended': { label: 'موقوف', bg: '#fef3c7', text: '#92400e' },
    'cancelled': { label: 'ملغى', bg: '#fee2e2', text: '#991b1b' }
  }

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <h1 className="page-title">ملفات الاشتراكات | Memberships Database</h1>
        <Link href="/system/memberships/new" className="btn btn-primary">
          تسجيل عضوية جديدة +
        </Link>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم العضوية</th>
              <th>النوع</th>
              <th>اسم العضو الرئيسي (رب الأسرة)</th>
              <th>الرقم القومي</th>
              <th>حالة الملف</th>
              <th>تاريخ القيد</th>
              <th>إدارة</th>
            </tr>
          </thead>
          <tbody>
            {(memberships || []).map((ms: any) => {
              // Ensure we typed the foreign key fetch properly
              const personData = Array.isArray(ms.main_person) ? ms.main_person[0] : ms.main_person;
              const sTag = statusTags[ms.status] || { label: ms.status, bg: '#f1f5f9', text: '#475569' };
              
              return (
                <tr key={ms.id}>
                  <td dir="ltr" style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {ms.membership_number}
                  </td>
                  <td>{typeLabels[ms.type] || ms.type}</td>
                  <td style={{ fontWeight: 600 }}>
                    {personData ? `${personData.first_name || ''} ${personData.last_name || ''}` : '-'}
                  </td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>
                    {personData?.national_id || '-'}
                  </td>
                  <td>
                    <span className="badge" style={{ background: sTag.bg, color: sTag.text, padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.85rem' }}>
                      {sTag.label}
                    </span>
                  </td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>{formatDate(ms.join_date)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Link href={`/system/memberships/${ms.id}`} className="btn btn-sm btn-primary" style={{ background: 'var(--surface)', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                        فتح الملف
                      </Link>
                      <DeleteMembershipBtn id={ms.id} />
                    </div>
                  </td>
                </tr>
              )
            })}
            {(!memberships || memberships.length === 0) && (
              <tr>
                <td colSpan={7} className="text-center" style={{ padding: '4rem', color: 'var(--text-muted)' }}>
                  لا توجد أي اشتراكات مسجلة في قاعدة البيانات بصورة نهائية!
                  <br /><br />
                  <Link href="/system/memberships/new" className="btn btn-sm btn-primary">بدء تسجيل أول عائلة الآن</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
