'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { provisionStaffAccount } from '@/server/actions/auth/provision-staff-account';
import { linkExistingStaffAccount } from '@/server/actions/auth/link-staff-account';
import { disableStaffAccount } from '@/server/actions/auth/disable-staff-account';
import styles from '@/features/memberships/components/add-membership-form.module.css';

interface AccountManagerProps {
  personId: string;
  staffMemberId: string;
  personName: string;
  personEmail: string;
  hasSystemUser: boolean;
  systemUserActive?: boolean;
  isLinkedToStaff: boolean;
}

export function AccountManager({
  personId,
  staffMemberId,
  personName,
  personEmail,
  hasSystemUser,
  systemUserActive,
  isLinkedToStaff,
}: AccountManagerProps) {
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [emailToProvision, setEmailToProvision] = useState(personEmail || '');

  const handleProvision = async () => {
    if (!emailToProvision) {
      setError('يجب إدخال البريد الإلكتروني لإنشاء الحساب');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    setTempPassword('');

    const formData = new FormData();
    formData.append('personId', personId);
    formData.append('staffMemberId', staffMemberId);
    formData.append('email', emailToProvision);

    try {
      const result = await provisionStaffAccount(formData);
      if (result.success && result.data) {
        setTempPassword(result.data.tempPassword);
        router.refresh();
      } else {
        setError(result.error || 'فشل إنشاء الحساب');
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLink = async () => {
    setError('');
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('personId', personId);
    formData.append('staffMemberId', staffMemberId);

    try {
      const result = await linkExistingStaffAccount(formData);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || 'فشل ربط الحساب');
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm('هل أنت متأكد من تعطيل حساب الدخول؟ لن يتمكن الموظف من استخدام النظام.')) return;
    
    setError('');
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('personId', personId);

    try {
      const result = await disableStaffAccount(formData);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || 'فشل تعطيل الحساب');
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.sectionCard} style={{ marginTop: '2rem' }}>
      <div className={styles.sectionTitle}>إدارة حساب الدخول (Auth Provisioning)</div>
      
      {error && <div className={styles.error} style={{ marginBottom: '1rem' }}>{error}</div>}

      {tempPassword && (
        <div className={`${styles.stateCard} ${styles.stateCardSuccess}`} style={{ marginBottom: '1.5rem' }}>
          <h4 className={styles.successText}>تم إنشاء الحساب بنجاح</h4>
          <p>يرجى نسخ كلمة المرور وإعطائها للموظف. <strong>لن يتم عرض كلمة المرور مرة أخرى!</strong></p>
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1.25rem', fontFamily: 'monospace', textAlign: 'center', direction: 'ltr' }}>
            {tempPassword}
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>البريد الإلكتروني للدخول: <span dir="ltr">{emailToProvision}</span></p>
        </div>
      )}

      {hasSystemUser ? (
        <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>يوجد حساب مسجل لهذا الشخص</span>
                <span style={{ 
                  padding: '0.2rem 0.5rem', 
                  borderRadius: '9999px', 
                  fontSize: '0.75rem', 
                  background: systemUserActive ? '#dcfce7' : '#fee2e2', 
                  color: systemUserActive ? '#166534' : '#991b1b' 
                }}>
                  {systemUserActive ? 'نشط' : 'معطل'}
                </span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {isLinkedToStaff 
                  ? 'تم ربط الحساب بنجاح بملف الموظف.'
                  : 'الشخص يمتلك حساب دخول مسبقاً (ربما كعضو مجلس إدارة أو دور آخر)، يمكنك ربط هذا الحساب بملف الموظف.'}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {!isLinkedToStaff && (
                <button 
                  type="button" 
                  className={styles.buttonPrimary} 
                  onClick={handleLink}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'جاري الربط...' : 'ربط الحساب الحالي'}
                </button>
              )}
              
              {systemUserActive && (
                <button 
                  type="button" 
                  className={styles.buttonSecondary} 
                  style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                  onClick={handleDisable}
                  disabled={isSubmitting}
                >
                  تعطيل الحساب
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>
            لا يوجد حساب دخول مسجل لهذا الشخص. يمكنك إنشاء حساب جديد بصلاحيات الدخول لكي يتمكن من استخدام النظام.
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className={styles.formGroup} style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
              <label className={styles.label}>البريد الإلكتروني للدخول</label>
              <input 
                type="email" 
                className={styles.input} 
                dir="ltr"
                value={emailToProvision} 
                onChange={e => setEmailToProvision(e.target.value)} 
                disabled={isSubmitting}
              />
            </div>
            <button 
              type="button" 
              className={styles.buttonPrimary} 
              onClick={handleProvision}
              disabled={isSubmitting || !emailToProvision}
            >
              {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء حساب جديد'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
