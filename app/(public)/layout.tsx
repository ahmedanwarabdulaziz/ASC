import Link from 'next/link';
import { ROUTES } from '@/lib/constants/routes';
import { APP_CONFIG } from '@/config/app';
import styles from './public.module.css';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <Link href={ROUTES.home} className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg viewBox="0 0 80 80" fill="none" stroke="currentColor">
                <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <circle cx="40" cy="40" r="28" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
                <path d="M40 16 L44 28 L56 28 L46 36 L50 48 L40 40 L30 48 L34 36 L24 28 L36 28 Z" fill="currentColor" opacity="0.9" />
              </svg>
            </div>
            <span className={styles.logoText}>{APP_CONFIG.clubNameAr}</span>
          </Link>
          
          <nav className={styles.nav}>
            <Link href={ROUTES.home} className={styles.navLink}>الرئيسية</Link>
            <Link href="/news" className={styles.navLink}>الأخبار</Link>
            <Link href="/sports" className={styles.navLink}>الرياضات</Link>
          </nav>
          
          <div className={styles.headerActions}>
            <Link href={ROUTES.auth.login} className={styles.loginBtn}>دخول النظام</Link>
          </div>
        </div>
      </header>
      
      <main className={styles.main}>
        {children}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerAbout}>
            <div className={styles.logo} style={{ color: 'white' }}>
              <div className={styles.logoIcon}>
                <svg viewBox="0 0 80 80" fill="none" stroke="currentColor">
                  <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                  <circle cx="40" cy="40" r="28" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
                  <path d="M40 16 L44 28 L56 28 L46 36 L50 48 L40 40 L30 48 L34 36 L24 28 L36 28 Z" fill="currentColor" opacity="0.9" />
                </svg>
              </div>
              <span className={styles.logoText}>{APP_CONFIG.clubNameAr}</span>
            </div>
            <p className={styles.footerDesc}>
              المنصة الرسمية لإدارة وتشغيل نادي أسيوط الرياضي. نهدف إلى تقديم أفضل الخدمات الرياضية والاجتماعية لأعضائنا.
            </p>
          </div>
          
          <div>
            <h3 className={styles.footerTitle}>روابط سريعة</h3>
            <ul className={styles.footerLinks}>
              <li><Link href={ROUTES.home}>الرئيسية</Link></li>
              <li><Link href="/news">الأخبار والفعاليات</Link></li>
              <li><Link href="/sports">الرياضات المتاحة</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className={styles.footerTitle}>تواصل معنا</h3>
            <ul className={styles.footerLinks}>
              <li>📍 أسيوط، مصر</li>
              <li>📧 info@assiutclub.com</li>
              <li>📞 +20 123 456 7890</li>
            </ul>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} {APP_CONFIG.clubNameAr}. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
