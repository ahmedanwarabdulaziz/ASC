'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ROUTES } from '@/lib/constants/routes';
import { APP_CONFIG } from '@/config/app';
import { toEnglishDigits } from '@/lib/utils/numbers';
import styles from './page.module.css';

export function LoginForm() {
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || ROUTES.system.root;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const email = `${nationalId}@assiutsc.com`;
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('الرقم القومي أو كلمة المرور غير صحيحة');
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <main className={styles.main}>
      {/* Background */}
      <div className={styles.bgOrbs}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
      </div>

      <div className={styles.container}>
        {/* Back to home */}
        <a href={ROUTES.home} className={styles.backLink} id="back-to-home-link">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M5 8L10 3M5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          العودة للرئيسية
        </a>

        {/* Login Card */}
        <div className={styles.card}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.badge}>
              <svg viewBox="0 0 40 40" fill="none" className={styles.badgeIcon} aria-hidden="true">
                <path
                  d="M20 4 L23 14 L33 14 L25 20 L28 30 L20 24 L12 30 L15 20 L7 14 L17 14 Z"
                  fill="currentColor"
                  opacity="0.9"
                />
              </svg>
            </div>
            <h1 className={styles.title}>تسجيل الدخول</h1>
            <p className={styles.subtitle}>{APP_CONFIG.clubNameAr}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className={styles.form}>
            <div className="form-group">
              <label htmlFor="nationalId" className="form-label">
                الرقم القومي
              </label>
              <input
                id="nationalId"
                type="text"
                inputMode="numeric"
                className="input-field"
                placeholder="29000000000000"
                dir="ltr"
                maxLength={14}
                minLength={14}
                pattern="\d{14}"
                title="الرقم القومي يجب أن يتكون من 14 رقم"
                value={nationalId}
                onChange={(e) => setNationalId(toEnglishDigits(e.target.value).replace(/\D/g, ''))}
                required
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                كلمة المرور
              </label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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
              id="login-submit-btn"
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  جاري الدخول...
                </>
              ) : (
                'دخول'
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
