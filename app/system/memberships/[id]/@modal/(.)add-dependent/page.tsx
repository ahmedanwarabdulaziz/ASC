'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { addDependentToMembership } from '@/features/memberships/actions'
import Modal from '@/components/ui/Modal'
import { use } from 'react'

export default function AddDependentModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [state, formAction, pending] = useActionState(addDependentToMembership, { error: '', success: false, data: {} as any })

  if (state.success) {
    // Automatically close the modal when save succeeds
    router.back();
  }

  return (
    <Modal>
      <div className="page-header" style={{ marginBottom: '1.5rem', textAlign: 'right' }}>
        <h2 className="page-title" style={{ fontSize: '1.5rem', marginBottom: 0 }}>إضافة فرد تابع</h2>
        <span style={{color: 'var(--text-muted)'}}>Add Family Dependent</span>
      </div>

      {state?.error && (
        <div className="alert-error" style={{ color: 'var(--error)', marginBottom: '1.5rem', padding: '1rem', background: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fee2e2' }}>
          {state.error}
        </div>
      )}

      <form action={formAction} className="auth-form" style={{ marginTop: '1rem' }}>
        <input type="hidden" name="membership_id" value={id} />

        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
           <div className="form-group" style={{ marginBottom: 0 }}>
             <label htmlFor="national_id">الرقم القومي <span style={{color: 'red'}}>*</span></label>
             <input type="text" id="national_id" name="national_id" className="form-input" minLength={14} maxLength={14} pattern="[0-9]{14}" required dir="ltr" defaultValue={state.data?.national_id} />
           </div>
           
           <div className="form-group" style={{ marginBottom: 0 }}>
             <label htmlFor="relationship">الصلة (القرابة) <span style={{color: 'red'}}>*</span></label>
             <select id="relationship" name="relationship" className="form-input" required defaultValue={state.data?.relationship || "wife"}>
               <option value="wife">زوجة</option>
               <option value="husband">زوج</option>
               <option value="son">ابن</option>
               <option value="daughter">ابنة</option>
               <option value="father">أب</option>
               <option value="mother">أم</option>
             </select>
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

        <div className="form-group" style={{ marginBottom: '2.5rem', maxWidth: '50%' }}>
          <label htmlFor="phone">رقم الهاتف المحمول <span style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>(إختياري للتابع)</span></label>
          <input type="tel" id="phone" name="phone" className="form-input" placeholder="01XXXXXXXXX" dir="ltr" pattern="^01[0125][0-9]{8}$" title="يجب أن يبدأ بـ 01 ويتكون من 11 رقم" maxLength={11} defaultValue={state.data?.phone} />
        </div>

        <div className="flex-between">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={pending}
            style={{ opacity: pending ? 0.7 : 1, width: '200px' }}
          >
            {pending ? 'جاري الإضافة...' : 'إضافة إلى الملف'}
          </button>

          <button type="button" onClick={() => router.back()} className="btn" style={{ background: '#e2e8f0', color: '#0f172a' }}>
            إلغاء
          </button>
        </div>
      </form>
    </Modal>
  )
}
