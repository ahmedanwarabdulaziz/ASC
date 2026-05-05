'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ROUTES } from '@/lib/constants/routes';
import styles from './layout.module.css';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(ROUTES.home);
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className={styles.logoutBtn}
      id="logout-btn"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M6 2H4C3.44772 2 3 2.44772 3 3V13C3 13.5523 3.44772 14 4 14H6M11 11L14 8M14 8L11 5M14 8H6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      خروج
    </button>
  );
}
