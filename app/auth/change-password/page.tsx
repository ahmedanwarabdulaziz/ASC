import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import { ChangePasswordForm } from './change-password-form';

export const metadata = {
  title: 'تغيير كلمة المرور',
};

export default async function ChangePasswordPage() {
  const user = await getUser();

  if (!user) {
    redirect(ROUTES.auth.login);
  }

  // If user doesn't need to change password, redirect to system
  if (!user.user_metadata?.must_change_password) {
    redirect(ROUTES.system.root);
  }

  return (
    <Suspense>
      <ChangePasswordForm isFirstLogin={true} />
    </Suspense>
  );
}
