import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import { ChangePasswordForm } from '@/app/auth/change-password/change-password-form';
import workspace from '@/features/system/components/workspace.module.css';

export const metadata = {
  title: 'تغيير كلمة المرور',
};

export default async function SystemChangePasswordPage() {
  const user = await getUser();

  if (!user) {
    redirect(ROUTES.auth.login);
  }

  return (
    <div className={workspace.page} dir="rtl">
      <section className={workspace.hero}>
        <div className={workspace.heroContent}>
          <h1 className={workspace.title}>تغيير كلمة المرور</h1>
          <p className={workspace.description}>
            قم بتغيير كلمة المرور الخاصة بحسابك. يجب إدخال كلمة المرور الحالية للتأكيد.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: '480px', margin: '0 auto', padding: '0 1rem 2rem' }}>
        <Suspense>
          <ChangePasswordForm isFirstLogin={false} />
        </Suspense>
      </section>
    </div>
  );
}
