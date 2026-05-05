'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { provisionStaffAccount } from '@/server/actions/auth/provision-staff-account';
import { linkExistingStaffAccount } from '@/server/actions/auth/link-staff-account';
import { disableStaffAccount, enableStaffAccount, resetStaffPassword } from '@/server/actions/auth/disable-staff-account';
import styles from '@/features/memberships/components/add-membership-form.module.css';

interface AccountManagerProps {
  personId: string;
  staffMemberId: string;
  personName: string;
  personNationalId: string;
  hasSystemUser: boolean;
  systemUserActive?: boolean;
  isLinkedToStaff: boolean;
}

export function AccountManager({
  personId,
  staffMemberId,
  personName,
  personNationalId,
  hasSystemUser,
  systemUserActive,
  isLinkedToStaff,
}: AccountManagerProps) {
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const makeFormData = (extra?: Record<string, string>) => {
    const fd = new FormData();
    fd.append('personId', personId);
    fd.append('staffMemberId', staffMemberId);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) fd.append(k, v);
    }
    return fd;
  };

  const resetFeedback = () => {
    setError('');
    setTempPassword('');
    setSuccessMessage('');
  };

  const handleProvision = async () => {
    if (!personNationalId) {
      setError('يجب تسجيل الرقم القومي للشخص أولاً قبل إنشاء حساب الدخول.');
      return;
    }
    resetFeedback();
    setIsSubmitting(true);

    try {
      const result = await provisionStaffAccount(makeFormData());
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
    resetFeedback();
    setIsSubmitting(true);

    try {
      const result = await linkExistingStaffAccount(makeFormData());
      if (result.success) {
        setSuccessMessage('تم ربط الحساب بنجاح.');
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
    resetFeedback();
    setIsSubmitting(true);

    try {
      const result = await disableStaffAccount(makeFormData());
      if (result.success) {
        setSuccessMessage('تم تعطيل الحساب.');
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

  const handleEnable = async () => {
    resetFeedback();
    setIsSubmitting(true);

    try {
      const result = await enableStaffAccount(makeFormData());
      if (result.success) {
        setSuccessMessage('تم تفعيل الحساب بنجاح.');
        router.refresh();
      } else {
        setError(result.error || 'فشل تفعيل الحساب');
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm(`هل أنت متأكد من إعادة تعيين كلمة مرور الموظف "${personName}"؟ سيتم إنشاء كلمة مرور مؤقتة جديدة.`)) return;
    resetFeedback();
    setIsSubmitting(true);

    try {
      const result = await resetStaffPassword(makeFormData());
      if (result.success && result.data) {
        setTempPassword(result.data.tempPassword);
        setSuccessMessage('تم إعادة تعيين كلمة المرور. سيُطلب من الموظف تغييرها عند الدخول.');
      } else {
        setError(result.error || 'فشل إعادة تعيين كلمة المرور');
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.sectionCard} style={{ marginTop: '2rem' }}>
      <div className={styles.sectionTitle}>إدارة حساب الدخول</div>
      
      {error && <div className={styles.error} style={{ marginBottom: '1rem' }}>{error}</div>}
      
      {successMessage && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#166534', fontSize: '0.9rem' }}>
          {successMessage}
        </div>
      )}

      {tempPassword && (
        <div className={`${styles.stateCard} ${styles.stateCardSuccess}`} style={{ marginBottom: '1.5rem' }}>
          <h4 className={styles.successText}>بيانات الدخول</h4>
          <p>يرجى نسخ البيانات وإعطائها للموظف. <strong>لن يتم عرض كلمة المرور مرة أخرى!</strong></p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>
            سيُطلب من الموظف تغيير كلمة المرور عند أول تسجيل دخول.
          </p>
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: '#fff', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            color: '#0f172a',
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>الرقم القومي (اسم المستخدم):</span>
              <div style={{ fontSize: '1.1rem', fontFamily: 'monospace', direction: 'ltr', fontWeight: 600, color: '#0f172a' }}>
                {personNationalId}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>كلمة المرور المؤقتة:</span>
              <div style={{ fontSize: '1.1rem', fontFamily: 'monospace', direction: 'ltr', fontWeight: 600, color: '#0f172a' }}>
                {tempPassword}
              </div>
            </div>
          </div>
        </div>
      )}

      {hasSystemUser ? (
        <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
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
                  ? 'تم ربط الحساب بملف الموظف.'
                  : 'الشخص يمتلك حساب دخول مسبقاً، يمكنك ربط هذا الحساب بملف الموظف.'}
              </p>
            </div>
          </div>

          {/* Admin Actions */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            flexWrap: 'wrap',
            paddingTop: '1rem',
            borderTop: '1px solid #e2e8f0',
          }}>
            {!isLinkedToStaff && (
              <button 
                type="button" 
                className={styles.buttonPrimary} 
                onClick={handleLink}
                disabled={isSubmitting}
                style={{ fontSize: '0.85rem' }}
              >
                {isSubmitting ? 'جاري الربط...' : 'ربط الحساب الحالي'}
              </button>
            )}

            {/* Activate / Deactivate */}
            {systemUserActive ? (
              <button 
                type="button" 
                className={styles.buttonSecondary} 
                style={{ color: '#ef4444', borderColor: '#fca5a5', fontSize: '0.85rem' }}
                onClick={handleDisable}
                disabled={isSubmitting}
              >
                تعطيل الحساب
              </button>
            ) : (
              <button 
                type="button" 
                className={styles.buttonPrimary} 
                style={{ background: '#16a34a', fontSize: '0.85rem' }}
                onClick={handleEnable}
                disabled={isSubmitting}
              >
                تفعيل الحساب
              </button>
            )}

            {/* Reset Password */}
            <button 
              type="button" 
              className={styles.buttonSecondary} 
              style={{ color: '#d97706', borderColor: '#fbbf24', fontSize: '0.85rem' }}
              onClick={handleResetPassword}
              disabled={isSubmitting}
            >
              إعادة تعيين كلمة المرور
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
            لا يوجد حساب دخول مسجل لهذا الشخص. يمكنك إنشاء حساب جديد ليتمكن من استخدام النظام.
          </p>
          {personNationalId ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                سيتم إنشاء الحساب بالرقم القومي: <strong dir="ltr" style={{ fontFamily: 'monospace' }}>{personNationalId}</strong>
              </p>
              <button 
                type="button" 
                className={styles.buttonPrimary} 
                onClick={handleProvision}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء حساب جديد'}
              </button>
            </div>
          ) : (
            <p style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 600 }}>
              يجب تسجيل الرقم القومي للشخص أولاً قبل إنشاء حساب الدخول.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
