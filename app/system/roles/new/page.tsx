'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { createRoleDefinition } from '@/features/roles/actions';

const initialState = {
  error: '',
}

export default function NewRolePage() {
  const [state, formAction, pending] = useActionState(createRoleDefinition, initialState)

  return (
    <div className="page-container" style={{ maxWidth: '600px' }}>
      <div className="page-header">
        <h1 className="page-title">إضافة دور جديد | Create New Role</h1>
      </div>

      <div className="auth-card" style={{ maxWidth: '100%', margin: 0 }}>
        {state?.error && (
          <div className="alert-error" style={{ color: 'var(--error)', marginBottom: '1.5rem', padding: '1rem', background: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fee2e2' }}>
            {state.error}
          </div>
        )}

        <form action={formAction} className="auth-form">
          <div className="form-group">
            <label htmlFor="name_ar">اسم الدور | Role Name <span style={{color: 'red'}}>*</span></label>
            <input type="text" id="name_ar" name="name_ar" className="form-input" placeholder="مثال: عضو عامل، مدرب كرة قدم..." required />
          </div>

          <div className="flex-between" style={{ marginTop: '2rem' }}>
            <Link href="/system/roles" className="btn" style={{ background: '#e2e8f0', color: '#0f172a' }}>
              إلغاء | Cancel
            </Link>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={pending}
              style={{ opacity: pending ? 0.7 : 1, width: '200px' }}
            >
              {pending ? 'جاري الحفظ... | Saving...' : 'حفظ الدور | Save Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
