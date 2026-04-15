'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { login } from '@/features/access-control/actions/auth';

const initialState = {
  error: '',
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await login(formData)
      if (result?.error) {
        return { error: result.error }
      }
      return prevState
    },
    initialState
  )

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>تسجيل الدخول</h2>
        <p className="auth-subtitle">مرحباً بك في نظام إدارة نادي أسيوط الرياضي</p>
        
        {state.error && (
          <div className="alert-error" style={{ color: 'var(--error)', marginBottom: '1rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '0.25rem', border: '1px solid #fee2e2' }}>
            {state.error}
          </div>
        )}

        <form action={formAction} className="auth-form">
          <div className="form-group">
            <label htmlFor="nationalId">الرقم القومي | National ID</label>
            <input 
              type="text" 
              id="nationalId" 
              name="nationalId" 
              className="form-input" 
              placeholder="أدخل الرقم القومي المكون من 14 رقم" 
              required
              minLength={14}
              maxLength={14}
              pattern="[0-9]*"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">كلمة المرور | Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              className="form-input" 
              placeholder="أدخل كلمة المرور" 
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-full text-center"
            disabled={pending}
            style={{ opacity: pending ? 0.7 : 1, cursor: pending ? 'not-allowed' : 'pointer' }}
          >
            {pending ? 'جاري الدخول...' : 'دخول | Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
