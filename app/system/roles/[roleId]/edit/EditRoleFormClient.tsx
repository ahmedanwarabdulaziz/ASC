'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { updateRoleDefinition } from '@/features/roles/mutations'

export default function EditRoleFormClient({ role }: { role: any }) {
  const [state, formAction, pending] = useActionState(updateRoleDefinition, { error: '', success: false })

  return (
    <div className="auth-card" style={{ maxWidth: '100%', margin: 0 }}>
      {state?.error && (
        <div className="alert-error" style={{ color: 'var(--error)', marginBottom: '1.5rem', padding: '1rem', background: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fee2e2' }}>
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="alert-success" style={{ color: 'var(--success)', marginBottom: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #dcfce7' }}>
          تم حفظ التعديلات بنجاح!
        </div>
      )}

      <form action={formAction} className="auth-form">
        <input type="hidden" name="id" value={role.id} />
        
        <div className="form-group">
          <label htmlFor="name_ar">اسم الدور الحالي <span style={{color: 'red'}}>*</span></label>
          <input type="text" id="name_ar" name="name_ar" className="form-input" defaultValue={role.name_ar} required />
        </div>

        <div className="flex-between" style={{ marginTop: '2rem' }}>
          <Link href="/system/roles" className="btn" style={{ background: '#e2e8f0', color: '#0f172a' }}>
            عودة للقائمة
          </Link>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={pending}
            style={{ opacity: pending ? 0.7 : 1, width: '200px' }}
          >
            {pending ? 'جاري الحفظ...' : 'تحديث الاسم'}
          </button>
        </div>
      </form>
    </div>
  )
}
