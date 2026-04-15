import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/formatters'

export default async function PeopleDashboard() {
  const supabase = await createClient()

  const { data: people } = await supabase
    .from('people')
    .select(`
      *,
      person_roles(role_definitions(name_ar)),
      membership_members(relationship, memberships(type, membership_number))
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="page-container">
      <div className="page-header flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>السجل العام للأفراد</h1>
          <span style={{ color: 'var(--text-muted)' }}>Global People Directory</span>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>الاسم الكامل</th>
              <th>الرقم القومي</th>
              <th>صفة الدخول (System Role)</th>
              <th>تاريخ الميلاد</th>
              <th>النوع</th>
              <th>رقم الهاتف</th>
              <th>تاريخ التسجيل</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {(people || []).map((person: any) => (
              <tr key={person.id}>
                <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{person.first_name} {person.last_name}</td>
                <td dir="ltr" style={{ textAlign: 'right' }}>{person.national_id}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {/* Render System Roles first */}
                    {person.person_roles && person.person_roles.map((pr: any, idx: number) => (
                      <span key={`pr-${idx}`} className="badge" style={{ background: '#fef3c7', color: '#d97706' }}>
                        {pr.role_definitions?.name_ar}
                      </span>
                    ))}
                    
                    {/* Render Membership Status */}
                    {person.membership_members && person.membership_members.map((link: any, idx: number) => {
                       const isPrincipal = link.relationship === 'principal';
                       return (
                         <span key={`mm-${idx}`} className="badge" style={{ background: isPrincipal ? '#dcfce7' : '#f3e8ff', color: isPrincipal ? '#166534' : '#6b21a8' }} title={`عضوية رقم: ${link.memberships?.membership_number || ''}`}>
                           {isPrincipal ? 'عضو رئيسي' : 'فرد تابع'}
                         </span>
                       )
                    })}

                    {(!person.person_roles?.length && !person.membership_members?.length) && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>غير نشط / بدون اشتراك</span>
                    )}
                  </div>
                </td>
                <td dir="ltr" style={{ textAlign: 'right' }}>{formatDate(person.birth_date) || 'غير مسجل'}</td>
                <td>
                  {person.gender === 'male' ? (
                     <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>ذكر</span>
                  ) : person.gender === 'female' ? (
                     <span className="badge" style={{ background: '#fce7f3', color: '#be185d' }}>أنثى</span>
                  ) : person.gender}
                </td>
                <td dir="ltr" style={{ textAlign: 'right' }}>{person.phone_number || 'غير مسجل'}</td>
                <td dir="ltr" style={{ textAlign: 'right' }}>
                  {formatDate(person.created_at)}
                </td>
                <td>
                  <Link href={`/system/people/${person.id}`} className="btn btn-sm" style={{ background: '#f1f5f9' }}>
                    عرض الملف الشامل
                  </Link>
                </td>
              </tr>
            ))}
            {people?.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  لا توجد أي سجلات أشخاص في قاعدة البيانات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
