'use client'

import { useActionState } from 'react'
import { updateSystemSettings } from '@/features/settings/actions'

export default function SettingsForm({
  minorMaxAge,
  seasonalPeriods
}: {
  minorMaxAge: number,
  seasonalPeriods: { season_1_start: string, season_1_end: string, season_2_start: string, season_2_end: string }
}) {
  const [state, formAction, pending] = useActionState(updateSystemSettings, { error: '', success: false })

  return (
    <div className="auth-card" style={{ maxWidth: '800px', margin: 0 }}>
      {state.success && (
         <div className="alert-success" style={{ color: 'var(--success)', marginBottom: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #dcfce7' }}>
            تم حفظ الإعدادات بنجاح.
         </div>
      )}
      
      {state.error && (
         <div className="alert-error" style={{ color: 'var(--error)', marginBottom: '1.5rem', padding: '1rem', background: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fee2e2' }}>
            {state.error}
         </div>
      )}

      <form action={formAction} className="auth-form">
        
        {/* Settings Block: Memberships Rules */}
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>قواعد الاعضاء التابعين | Dependents Limits</h3>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="minor_max_age">السن القانوني لفصل العضوية التابعة (سن الرشد) <span style={{color: 'red'}}>*</span></label>
            <input type="number" id="minor_max_age" name="minor_max_age" className="form-input" defaultValue={minorMaxAge} required min="16" max="30" />
            <small style={{display: 'block', marginTop: '0.5rem', color: 'var(--text-muted)'}}>
              عند وصول الأبناء لهذا السن (مثلاً 21 عاماً)، سيقوم النظام أوتوماتيكياً باقتراح فصلهم في عضوية مستقلة طبقا للائحة.
            </small>
          </div>
        </div>

        {/* Settings Block: Seasonal Memberships */}
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>فترات العضويات الموسمية | Seasonal Periods</h3>
          
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="season_1_start" style={{ fontWeight: 'bold' }}>بداية الموسم الأول (صيفي/الفترة الأولى)</label>
              <input type="date" id="season_1_start" name="season_1_start" className="form-input" defaultValue={seasonalPeriods.season_1_start} required lang="en-GB" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="season_1_end" style={{ fontWeight: 'bold' }}>نهاية الموسم الأول</label>
              <input type="date" id="season_1_end" name="season_1_end" className="form-input" defaultValue={seasonalPeriods.season_1_end} required lang="en-GB" />
            </div>
          </div>

          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: 0 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="season_2_start" style={{ fontWeight: 'bold' }}>بداية الموسم الثاني (شتوي/الفترة الثانية)</label>
              <input type="date" id="season_2_start" name="season_2_start" className="form-input" defaultValue={seasonalPeriods.season_2_start} required lang="en-GB" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="season_2_end" style={{ fontWeight: 'bold' }}>نهاية الموسم الثاني</label>
              <input type="date" id="season_2_end" name="season_2_end" className="form-input" defaultValue={seasonalPeriods.season_2_end} required lang="en-GB" />
            </div>
          </div>
          <small style={{display: 'block', marginTop: '1rem', color: 'var(--text-muted)'}}>
            حدد تواريخ الفترات بالضبط لتتمكن إدارة الخزينة من إصدار والتحكم باشتراكات المواسم المحددة.
          </small>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary w-full"
          disabled={pending}
          style={{ opacity: pending ? 0.7 : 1 }}
        >
          {pending ? 'جاري الحفظ...' : 'حفظ التعديلات | Save Changes'}
        </button>
      </form>
    </div>
  )
}
