'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setInitialPassword, changePassword } from '@/server/actions/auth/change-password';
import { APP_CONFIG } from '@/config/app';
import { ROUTES } from '@/lib/constants/routes';
import styles from '../login/page.module.css';

interface ChangePasswordFormProps {
  isFirstLogin: boolean;
}

export function ChangePasswordForm({ isFirstLogin }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    if (newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);

    const formData = new FormData();

    if (isFirstLogin) {
      formData.append('newPassword', newPassword);
      const result = await setInitialPassword(formData);

      if (result.success) {
        router.push(ROUTES.system.root);
        router.refresh();
      } else {
        setError(result.error || 'حدث خطأ');
        setLoading(false);
      }
    } else {
      formData.append('currentPassword', currentPassword);
      formData.append('newPassword', newPassword);
      const result = await changePassword(formData);

      if (result.success) {
        router.push(ROUTES.system.root);
        router.refresh();
      } else {
        setError(result.error || 'حدث خطأ');
        setLoading(false);
      }
    }
  }

  return (
    <main className={styles.main}>
      {/* Background */}
      <div className={styles.bgOrbs}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
      </div>

      <div className={styles.container}>
        {!isFirstLogin && (
          <a href={ROUTES.system.root} className={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M5 8L10 3M5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            العودة للنظام
          </a>
        )}

        <div className={styles.card}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.badge}>
              <svg viewBox="0 0 40 40" fill="none" className={styles.badgeIcon} aria-hidden="true">
                <path
                  d="M20 8C17.8 8 16 9.8 16 12C16 14.2 17.8 16 20 16C22.2 16 24 14.2 24 12C24 9.8 22.2 8 20 8ZM14 18C14 18 12 18 12 20C12 22 14 28 20 28C26 28 28 22 28 20C28 18 26 18 26 18H14Z"
                  fill="currentColor"
                  opacity="0.9"
                />
              </svg>
            </div>
            <h1 className={styles.title}>
              {isFirstLogin ? 'تعيين كلمة المرور' : 'تغيير كلمة المرور'}
            </h1>
            <p className={styles.subtitle}>
              {isFirstLogin
                ? 'مرحباً بك! يرجى تعيين كلمة مرور جديدة لحسابك.'
                : APP_CONFIG.clubNameAr}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {!isFirstLogin && (
              <div className="form-group">
                <label htmlFor="currentPassword" className="form-label">
                  كلمة المرور الحالية
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  dir="ltr"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">
                كلمة المرور الجديدة
              </label>
              <input
                id="newPassword"
                type="password"
                className="input-field"
                placeholder="••••••••"
                dir="ltr"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                تأكيد كلمة المرور الجديدة
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="input-field"
                placeholder="••••••••"
                dir="ltr"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                disabled={loading}
              />
            </div>

            {error && (
              <div className={styles.errorBox} role="alert">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 5V8.5M8 10.5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className={`btn btn-primary btn-lg ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  جاري الحفظ...
                </>
              ) : (
                isFirstLogin ? 'تعيين كلمة المرور والدخول' : 'حفظ كلمة المرور الجديدة'
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
