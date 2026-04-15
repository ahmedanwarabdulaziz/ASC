import Link from 'next/link';
import { logout } from '@/features/access-control/actions/auth';

export default function SystemLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="system-layout">
      <aside className="system-sidebar">
        <div className="sidebar-header">
          <h2>نادي أسيوط</h2>
          <span>Assiut SC</span>
        </div>
        <nav className="sidebar-nav">
          <Link href="/system" className="nav-item">لوحة القيادة | Dashboard</Link>
          <Link href="/system/people" className="nav-item">الأشخاص | People</Link>
          <Link href="/system/roles" className="nav-item">إعدادات الأدوار | Roles</Link>
          <Link href="/system/settings" className="nav-item">الإعدادات العامة | Settings</Link>
          <Link href="/system/memberships" className="nav-item">العضويات | Memberships</Link>
          <form action={logout} style={{ marginTop: 'auto' }}>
            <button type="submit" className="nav-item logout w-full text-right" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'right', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem', display: 'flex' }}>
              خروج | Logout
            </button>
          </form>
        </nav>
      </aside>
      <main className="system-content">
        {children}
      </main>
    </div>
  );
}
