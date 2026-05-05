import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import styles from '../page.module.css';

export const metadata = {
  title: 'الأخبار والفعاليات',
};

export const revalidate = 60;

export default async function NewsPage() {
  const supabase = await createClient();

  const { data: news } = await supabase
    .from('cms_articles')
    .select('id, title, slug, excerpt, cover_image_url, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  return (
    <div className={styles.container}>
      <div className={styles.hero} style={{ minHeight: '300px', padding: '4rem 1.5rem' }}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle} style={{ fontSize: '3.5rem' }}>الأخبار والفعاليات</h1>
          <p className={styles.heroSubtitle}>
            تابع أحدث تغطيات ومستجدات نادي أسيوط الرياضي
          </p>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.newsGrid}>
          {news && news.length > 0 ? (
            news.map((article) => (
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
    </div>
  );
}
