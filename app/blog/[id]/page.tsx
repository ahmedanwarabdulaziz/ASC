import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { BlogPost, BlogPostImage } from '@/types';
import { notFound } from 'next/navigation';

async function getPost(id: string): Promise<BlogPost | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select(`
        *,
        author:users(id, email, display_name),
        category:blog_categories(*)
      `)
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (error || !data) return null;
    return data as BlogPost;
  } catch {
    return null;
  }
}

async function getPostImages(postId: string): Promise<BlogPostImage[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('blog_post_images')
      .select('*')
      .eq('post_id', postId)
      .order('order_index', { ascending: true });

    if (error) {
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    return data as BlogPostImage[];
  } catch {
    return [];
  }
}

function formatArabicDate(dateString: string | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    calendar: 'gregory'
  }).format(date);
}

export default async function BlogPostPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await getPost(params.id);
  
  if (!post) {
    notFound();
  }

  const images = await getPostImages(post.id);

  return (
    <div className="min-h-screen bg-black" dir="rtl">
      <Navigation />
      <main>
        {/* Hero Section with Featured Image */}
        {post.featured_image_url && (
          <section className="relative w-full h-[400px] md:h-[600px] overflow-hidden">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60"></div>
            <div className="absolute inset-0 flex items-end">
              <div className="container mx-auto px-4 pb-12">
                <div className="max-w-4xl">
                  <div className="flex items-center gap-2 mb-4">
                    {post.is_featured && (
                      <span className="px-3 py-1 text-sm font-bold bg-yellow-500/20 text-yellow-400 rounded">
                        مقال مميز
                      </span>
                    )}
                    {post.category && (
                      <span className="px-3 py-1 text-sm bg-gray-800/80 text-white rounded">
                        {post.category.name}
                      </span>
                    )}
                    <span className="px-3 py-1 text-sm bg-gray-800/80 text-white rounded">
                      {formatArabicDate(post.published_at)}
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                    {post.title}
                  </h1>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Article Content */}
        <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
          <div className="container mx-auto max-w-4xl">
            {!post.featured_image_url && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                  {post.is_featured && (
                    <span className="px-3 py-1 text-sm font-bold bg-yellow-500/20 text-yellow-400 rounded">
                      مقال مميز
                    </span>
                  )}
                  {post.category && (
                    <span className="px-3 py-1 text-sm bg-gray-800 text-white rounded">
                      {post.category.name}
                    </span>
                  )}
                  <span className="px-3 py-1 text-sm bg-gray-800 text-white rounded">
                    {formatArabicDate(post.published_at)}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                  {post.title}
                </h1>
              </div>
            )}

            {/* Article Content */}
            <div className="bg-gray-900/50 border border-yellow-500/20 rounded-2xl p-8 md:p-12 shadow-2xl">
              <div
                className="prose prose-invert prose-lg max-w-none text-white leading-relaxed [&_*]:text-white [&_p]:text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_h5]:text-white [&_h6]:text-white [&_li]:text-white [&_span]:text-white [&_div]:text-white"
                dangerouslySetInnerHTML={{ __html: post.content }}
                style={{
                  direction: 'rtl',
                  textAlign: 'right',
                  color: '#ffffff',
                }}
              />

              {/* Additional Images Gallery */}
              {images && images.length > 0 && (
                <div className="mt-12 pt-12 border-t border-yellow-500/20">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
                    <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                      معرض الصور
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {images.map((image, index) => (
                      <div 
                        key={image.id} 
                        className="group relative bg-gray-800/50 rounded-2xl overflow-hidden border-2 border-yellow-500/20 hover:border-yellow-500/50 transition-all duration-300 shadow-2xl"
                      >
                        <div className="w-full overflow-hidden bg-gray-900">
                          <img
                            src={image.image_url}
                            alt={image.alt_text || `${post.title} - صورة ${index + 1}`}
                            className="w-full h-auto max-h-[600px] object-contain transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                        {image.alt_text && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-6">
                            <p className="text-white text-base font-medium">{image.alt_text}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Back to Blog Button */}
            <div className="mt-12 text-center">
              <Link href="/blog" className="inline-block">
                <button className="px-10 py-4 bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-700 hover:from-yellow-600 hover:via-yellow-700 hover:to-yellow-800 text-black font-bold text-lg rounded-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-yellow-400">
                  العودة للمدونة
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

