import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import styles from './page.module.css';

// Revalidate public page every 60 seconds
export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch latest 3 published news articles
  const { data: latestNews } = await supabase
    .from('cms_articles')
    .select('id, title, slug, excerpt, cover_image_url, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(3);

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <span className={styles.heroEyebrow}>أهلاً بكم في الموقع الرسمي</span>
          <h1 className={styles.heroTitle}>نادي أسيوط الرياضي</h1>
          <p className={styles.heroSubtitle}>
            صرح رياضي واجتماعي عريق، نقدم أفضل الخدمات والأنشطة لأعضائنا وللمجتمع.
          </p>
          <div className={styles.heroActions}>
            <Link href="/news" className={styles.btnPrimary}>آخر الأخبار</Link>
            <Link href="/sports" className={styles.btnSecondary}>الرياضات المتاحة</Link>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className={styles.stats}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>+15</div>
            <div className={styles.statLabel}>رياضة مختلفة</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>+50</div>
            <div className={styles.statLabel}>مدرب معتمد</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>+2000</div>
            <div className={styles.statLabel}>لاعب ولاعبة</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>+10</div>
            <div className={styles.statLabel}>منشآت رياضية</div>
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>أحدث الأخبار والفعاليات</h2>
          <Link href="/news" className={styles.sectionLink}>عرض كل الأخبار ←</Link>
        </div>
        
        <div className={styles.newsGrid}>
          {latestNews && latestNews.length > 0 ? (
            latestNews.map((article) => (
              <Link href={`/news/${article.slug}`} key={article.id} className={styles.newsCard}>
                <div className={styles.newsImageContainer}>
                  {article.cover_image_url ? (
                    <img src={article.cover_image_url} alt={article.title} className={styles.newsImage} />
                  ) : (
                    <div className={styles.newsPlaceholder}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                <div className={styles.newsContent}>
                  <div className={styles.newsDate}>
                    {new Date(article.published_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <h3 className={styles.newsTitle}>{article.title}</h3>
                  {article.excerpt && <p className={styles.newsExcerpt}>{article.excerpt}</p>}
                </div>
              </Link>
            ))
          ) : (
            <div className={styles.emptyState}>لا توجد أخبار منشورة حالياً</div>
          )}
        </div>
      </section>

      {/* Access Portal */}
      <section className={styles.portalSection}>
        <div className={styles.portalCard}>
          <div className={styles.portalIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2>النظام الإداري</h2>
          <p>بوابة الدخول المخصصة للإدارة، الموظفين، والمدربين لإدارة النادي.</p>
          <Link href={ROUTES.auth.login} className={styles.btnPrimary}>دخول النظام</Link>
        </div>
      </section>
    </div>
  );
}
