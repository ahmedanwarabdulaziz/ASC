'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createRoleDefinition } from '@/features/roles/actions';
import Modal from '@/components/ui/Modal';

const initialState = {
  error: '',
}

export default function NewRoleModal() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createRoleDefinition, initialState);

  return (
    <Modal>
      <div className="page-header" style={{ marginBottom: '1.5rem', textAlign: 'right' }}>
        <h2 className="page-title" style={{ fontSize: '1.75rem', marginBottom: 0 }}>إضافة دور جديد</h2>
        <span style={{color: 'var(--text-muted)'}}>Create New Role</span>
      </div>

      {state?.error && (
        <div className="alert-error" style={{ color: 'var(--error)', marginBottom: '1.5rem', padding: '1rem', background: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fee2e2' }}>
          {state.error}
        </div>
      )}

      <form action={formAction} className="auth-form" style={{ marginTop: '1rem' }}>
        <div className="form-group" style={{ marginBottom: '2.5rem' }}>
          <label htmlFor="name_ar">اسم الدور بالعربية <span style={{color: 'red'}}>*</span></label>
          <input type="text" id="name_ar" name="name_ar" className="form-input" placeholder="مثال: مدرب رياضي، عضو عامل..." required />
        </div>

        <div className="flex-between">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={pending}
            style={{ opacity: pending ? 0.7 : 1, width: '200px' }}
          >
            {pending ? 'جاري الحفظ... | Saving...' : 'حفظ الدور | Save Role'}
          </button>

          <button type="button" onClick={() => router.back()} className="btn" style={{ background: '#e2e8f0', color: '#0f172a' }}>
            إلغاء | Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
