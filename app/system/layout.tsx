import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { APP_CONFIG } from '@/config/app';
import styles from './layout.module.css';
import { LogoutButton } from './logout-button';
import { SystemNav } from './system-nav';

async function getUserDisplayName(userId: string): Promise<string> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('system_users')
      .select('people:person_id(first_name, second_name, last_name)')
      .eq('auth_user_id', userId)
      .single();

    if (data?.people) {
      const p = data.people as any;
      const parts = [p.first_name, p.second_name, p.last_name].filter(Boolean);
      return parts.join(' ') || 'مستخدم';
    }
  } catch {
    // Fall through
  }
  return 'مستخدم';
}

export default async function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect(ROUTES.auth.login);
  }

  const displayName = await getUserDisplayName(user.id);

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
          <span className={styles.userEmail}>{displayName}</span>
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            <Link
              href="/system/change-password"
              className={styles.logoutBtn}
              style={{ fontSize: '0.7rem', padding: '0.3rem 0.5rem' }}
              title="تغيير كلمة المرور"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M11 1L13 3L11 5M3 8C3 5.2 5.2 3 8 3H13M5 15L3 13L5 11M13 8C13 10.8 10.8 13 8 13H3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              كلمة المرور
            </Link>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
