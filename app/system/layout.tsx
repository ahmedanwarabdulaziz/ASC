import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import { APP_CONFIG } from '@/config/app';
import styles from './layout.module.css';
import { LogoutButton } from './logout-button';
import { SystemNav } from './system-nav';

export default async function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect(ROUTES.auth.login);
  }

  return (
    <div className={styles.shell}>
      {/* Sidebar Navigation */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.headerBadge}>
            <svg viewBox="0 0 28 28" fill="none" className={styles.headerBadgeIcon} aria-hidden="true">
              <path
                d="M14 3 L16 10 L23 10 L17.5 14.5 L19.5 22 L14 17.5 L8.5 22 L10.5 14.5 L5 10 L12 10 Z"
                fill="currentColor"
                opacity="0.9"
              />
            </svg>
          </div>
          <span className={styles.headerTitle}>{APP_CONFIG.clubNameAr}</span>
        </div>

        <SystemNav />

        <div className={styles.sidebarFooter}>
          <span className={styles.userEmail}>{user.email}</span>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
