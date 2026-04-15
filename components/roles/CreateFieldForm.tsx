'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createRoleField } from '@/features/roles/actions';

export default function CreateFieldForm({ roleId }: { roleId: string }) {
  const [state, formAction, pending] = useActionState(createRoleField, { error: '', success: false });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && formRef.current) {
      formRef.current.reset();
    }
  }, [state.success]);

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: '#1e3a5f', color: 'white' }}>
        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>إضافة حقل جديد | Add Field</h3>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {state.error && (
          <div className="alert-error" style={{ color: 'var(--error)', marginBottom: '1rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fee2e2', fontSize: '0.9rem' }}>
            {state.error}
          </div>
        )}
        
        {state.success && (
          <div className="alert-success" style={{ color: 'var(--success)', marginBottom: '1rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #dcfce7', fontSize: '0.9rem' }}>
            تم إضافة الحقل بنجاح!
          </div>
        )}

        <form action={formAction} ref={formRef} className="auth-form" key={state.success ? Date.now() : 'form'}>
          <input type="hidden" name="role_id" value={roleId} />

          <div className="form-group">
            <label htmlFor="name_ar">اسم الحقل <span style={{color: 'red'}}>*</span></label>
            <input type="text" id="name_ar" name="name_ar" className="form-input" placeholder="مثال: التخصص، الراتب، تاريخ الميلاد..." required />
          </div>

          <div className="form-group">
            <label htmlFor="field_type">نوع الحقل <span style={{color: 'red'}}>*</span></label>
            <select id="field_type" name="field_type" className="form-input" required defaultValue="text" onChange={(e) => {
              const el = document.getElementById('options-wrapper');
              if(el) el.style.display = e.target.value === 'select' ? 'block' : 'none';
            }}>
              <option value="text">نص (Text)</option>
              <option value="number">رقم (Number)</option>
              <option value="date">تاريخ (Date)</option>
              <option value="boolean">نعم/لا (Boolean/Checkbox)</option>
              <option value="select">قائمة منسدلة (Dropdown List)</option>
            </select>
          </div>

          <div id="options-wrapper" className="form-group" style={{ display: 'none' }}>
            <label htmlFor="list_options">خيارات القائمة المنسدلة <span style={{color: 'red'}}>*</span></label>
            <input type="text" id="list_options" name="list_options" className="form-input" placeholder="مثال: كرة قدم, سباحة, تنس (افصل بفاصلة ,)" />
            <small style={{ color: 'var(--text-muted)' }}>مطلوب في حال اختيار نوع "قائمة منسدلة"</small>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
            <input type="checkbox" id="is_required" name="is_required" style={{ width: '1.25rem', height: '1.25rem' }} />
            <label htmlFor="is_required" style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--primary)', marginBottom: 0 }}>
              حقل إلزامي (Required / Mandatory)
            </label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full text-center"
            disabled={pending}
            style={{ opacity: pending ? 0.7 : 1 }}
          >
            {pending ? 'جاري الحفظ...' : 'حفظ الحقل'}
          </button>
        </form>
      </div>
    </div>
  );
}
