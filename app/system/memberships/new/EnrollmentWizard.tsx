'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { enrollNewMembership } from '@/features/memberships/actions'

export default function EnrollmentWizard() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(enrollNewMembership, { error: '', success: false, data: {} as any })

  return (
    <div className="wizard-container" style={{ maxWidth: '900px', margin: '0 auto', borderTop: '4px solid var(--primary)', paddingTop: '1rem' }}>
      {state.error && (
        <div className="alert-error" style={{ color: 'var(--error)', marginBottom: '1.5rem', padding: '1rem', background: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fee2e2' }}>
          {state.error}
        </div>
      )}

      <form action={formAction} className="auth-form">
        
        {/* Step 1: Membership Financial Block */}
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
             (1) البيانات المالية والإدارية للاشتراك
          </h3>
          
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="membership_number">رقم العضوية (يجب أن يكون فريداً) <span style={{color: 'red'}}>*</span></label>
              <input type="text" id="membership_number" name="membership_number" className="form-input text-lg font-bold" placeholder="مثال: 2026-0001" required dir="ltr" style={{ border: '2px solid var(--primary)' }} defaultValue={state.data?.membership_number} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="membership_type">نوع الاشتراك الأساسي <span style={{color: 'red'}}>*</span></label>
              <select id="membership_type" name="membership_type" className="form-input" required defaultValue={state.data?.membership_type || "working"}>
                <option value="working">عضوية عاملة (Working)</option>
                <option value="sports">عضوية رياضية (Sports)</option>
                <option value="affiliate">عضوية شرفية/تابعة (Affiliate)</option>
                <option value="seasonal_1">عضوية موسمية (الفترة الأولى)</option>
                <option value="seasonal_2">عضوية موسمية (الفترة الثانية)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Principal Profile Block */}
        <div style={{ padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
             (2) بيانات العضو الرئيسي (رب الأسرة)
          </h3>
          
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
              <label htmlFor="national_id">الرقم القومي (14 رقم) <span style={{color: 'red'}}>*</span></label>
              <input type="text" id="national_id" name="national_id" className="form-input text-lg" placeholder="14 رقم" required minLength={14} maxLength={14} pattern="[0-9]{14}" dir="ltr" defaultValue={state.data?.national_id} />
              <small style={{display: 'block', marginTop: '0.5rem', color: 'var(--success)'}}>
                لا تقلق بشأن تاريخ الميلاد، سيقوم النظام باستخراجهم أوتوماتيكياً من الرقم القومي!
              </small>
            </div>
          </div>

          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
             <div className="form-group" style={{ marginBottom: 0 }}>
               <label htmlFor="first_name">الاسم الأول <span style={{color: 'red'}}>*</span></label>
               <input type="text" id="first_name" name="first_name" className="form-input" required defaultValue={state.data?.first_name} />
             </div>
             <div className="form-group" style={{ marginBottom: 0 }}>
               <label htmlFor="second_name">الاسم الثاني</label>
               <input type="text" id="second_name" name="second_name" className="form-input" defaultValue={state.data?.second_name} />
             </div>
             <div className="form-group" style={{ marginBottom: 0 }}>
               <label htmlFor="third_name">الاسم الثالث</label>
               <input type="text" id="third_name" name="third_name" className="form-input" defaultValue={state.data?.third_name} />
             </div>
             <div className="form-group" style={{ marginBottom: 0 }}>
               <label htmlFor="last_name">اللقب/العائلة <span style={{color: 'red'}}>*</span></label>
               <input type="text" id="last_name" name="last_name" className="form-input" required defaultValue={state.data?.last_name} />
             </div>
          </div>

          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="gender">النوع <span style={{color: 'red'}}>*</span></label>
              <select id="gender" name="gender" className="form-input" required defaultValue={state.data?.gender || "male"}>
                <option value="male">ذكر (Male)</option>
                <option value="female">أنثى (Female)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="phone">رقم الهاتف المحمول <span style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>(إختياري)</span></label>
              <input type="tel" id="phone" name="phone" className="form-input" placeholder="01XXXXXXXXX" dir="ltr" pattern="^01[0125][0-9]{8}$" title="يجب أن يبدأ بـ 01 ويتكون من 11 رقم" maxLength={11} defaultValue={state.data?.phone} />
            </div>
          </div>
        </div>

        <div className="flex-between" style={{ marginTop: '3rem' }}>
          <button type="button" onClick={() => router.back()} className="btn" style={{ background: '#e2e8f0', color: '#0f172a', padding: '0.75rem 2rem' }}>
            إلغاء وإغلاق
          </button>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={pending}
            style={{ opacity: pending ? 0.7 : 1, width: '250px', padding: '0.75rem 0', fontSize: '1.1rem' }}
          >
            {pending ? 'جاري إنشاء الملف...' : 'إنشاء العضوية الآن'}
          </button>
        </div>
      </form>
    </div>
  )
}
