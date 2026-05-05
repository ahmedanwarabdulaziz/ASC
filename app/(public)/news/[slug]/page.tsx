import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import styles from './article.module.css';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: article } = await supabase
    .from('cms_articles')
    .select('title, excerpt, cover_image_url')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!article) return { title: 'مقال غير موجود' };

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      images: article.cover_image_url ? [article.cover_image_url] : [],
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();

  const { data: article } = await supabase
    .from('cms_articles')
    .select(`
      *,
      author:author_id (raw_user_meta_data, email)
    `)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!article) notFound();

  return (
    <div className={styles.articlePage}>
      {article.cover_image_url && (
        <div className={styles.coverImageContainer}>
          <img src={article.cover_image_url} alt={article.title} className={styles.coverImage} />
        </div>
      )}
      
      <div className={styles.articleContainer}>
        <header className={styles.header}>
          <div className={styles.meta}>
            <span className={styles.date}>
              {new Date(article.published_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            {article.author && (
              <>
                <span className={styles.separator}>•</span>
                <span className={styles.author}>بقلم {article.author.raw_user_meta_data?.name || article.author.email}</span>
              </>
            )}
          </div>
          <h1 className={styles.title}>{article.title}</h1>
        </header>

        <div className={styles.content}>
          {/* Extremely basic markdown to HTML for presentation purposes */}
          {article.content.split('\n').map((paragraph: string, idx: number) => {
            if (!paragraph.trim()) return <br key={idx} />;
            if (paragraph.startsWith('###')) return <h3 key={idx}>{paragraph.replace('###', '').trim()}</h3>;
            if (paragraph.startsWith('##')) return <h2 key={idx}>{paragraph.replace('##', '').trim()}</h2>;
            if (paragraph.startsWith('#')) return <h1 key={idx}>{paragraph.replace('#', '').trim()}</h1>;
            return <p key={idx}>{paragraph}</p>;
          })}
        </div>
      </div>
    </div>
  );
}
