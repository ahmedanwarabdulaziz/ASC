import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { BlogPost, SiteBio, BlogCategory } from '@/types';

async function getBio(): Promise<SiteBio | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_bio')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data as SiteBio;
  } catch {
    return null;
  }
}

async function getFeaturedPosts(): Promise<BlogPost[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select(`
        *,
        author:users(id, email, display_name),
        category:blog_categories(*)
      `)
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(8);

    if (error || !data) return [];
    return data as BlogPost[];
  } catch {
    return [];
  }
}

async function getAllPosts(page: number = 1, limit: number = 10): Promise<{ posts: BlogPost[]; total: number }> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabaseAdmin
      .from('blog_posts')
      .select(`
        *,
        author:users(id, email, display_name),
        category:blog_categories(*)
      `, { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(from, to);

    if (error) return { posts: [], total: 0 };
    return { posts: (data || []) as BlogPost[], total: count || 0 };
  } catch {
    return { posts: [], total: 0 };
  }
}

function formatArabicDate(dateString: string | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregory'
  }).format(date);
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page || '1', 10);
  const bio = await getBio();
  const featuredPosts = await getFeaturedPosts();
  const { posts, total } = await getAllPosts(page, 10);
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="min-h-screen bg-black" dir="rtl">
      <Navigation />
      <main>
        {/* Hero Section */}
        <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-black">
          <picture className="absolute top-0 left-0 w-full h-full z-0">
            <source media="(min-width: 768px)" srcSet="/img/Nageh%20Hero%20web.jpg" />
            <img
              src="/img/nageh-hero.jpg"
              alt="Hero Background"
              className="w-full h-full object-cover"
            />
          </picture>
          <div className="absolute inset-0 bg-black/60 z-[1]"></div>
          
          <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center">
            <div className="text-center max-w-4xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                ناجح البارودي
              </h1>
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-8 leading-tight">
                <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                  مرشح رئاسة مجلس ادارة نادي اسيوط الرياضي
                </span>
              </h2>
            </div>
          </div>
        </section>

        {/* Bio Section */}
        {bio && (
          <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
            <div className="container mx-auto max-w-4xl">
              <div className="bg-gray-900/50 border border-yellow-500/20 rounded-2xl p-8 md:p-12 shadow-2xl">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                  <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                    من هو ناجح البارودي
                  </span>
                </h2>
                
                <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
                  <p className="text-xl text-white font-semibold">
                    {bio.bio_text}
                  </p>
                </div>
              </div>

              {/* Vision & Mission Cards */}
              {(bio.vision_text || bio.mission_text) && (
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {bio.vision_text && (
                    <div className="bg-gray-900/50 border border-yellow-500/20 rounded-xl p-8 hover:border-yellow-500/50 transition-all duration-300">
                      <h3 className="text-2xl font-bold text-yellow-500 mb-4">رؤيتنا</h3>
                      <p className="text-white leading-relaxed">
                        {bio.vision_text}
                      </p>
                    </div>
                  )}
                  
                  {bio.mission_text && (
                    <div className="bg-gray-900/50 border border-yellow-500/20 rounded-xl p-8 hover:border-yellow-500/50 transition-all duration-300">
                      <h3 className="text-2xl font-bold text-yellow-500 mb-4">رسالتنا</h3>
                      <p className="text-white leading-relaxed">
                        {bio.mission_text}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Featured Articles Section */}
        {featuredPosts.length > 0 && (
          <section className="py-20 px-4 bg-black">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  شاركنا اهم الاحداث مع ناجح البارودي
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.id}`}
                    className="bg-gray-900/50 border border-yellow-500/20 rounded-xl overflow-hidden hover:border-yellow-500/50 transition-all duration-300 transform hover:scale-105"
                  >
                    {(post.thumbnail_image_url || post.featured_image_url) && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={post.thumbnail_image_url || post.featured_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        {post.is_featured && (
                          <span className="px-2 py-1 text-xs font-bold bg-yellow-500/20 text-yellow-400 rounded">
                            مميز
                          </span>
                        )}
                        {post.category && (
                          <span className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded">
                            {post.category.name}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">
                        {post.title}
                      </h3>
                      <p className="text-white text-sm font-medium">
                        {formatArabicDate(post.published_at || post.created_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Articles Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                جميع المقالات
              </span>
            </h2>
            
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">لا توجد مقالات متاحة حالياً</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.id}`}
                      className="bg-gray-900/50 border border-yellow-500/20 rounded-xl overflow-hidden hover:border-yellow-500/50 transition-all duration-300 transform hover:scale-105"
                    >
                      {(post.thumbnail_image_url || post.featured_image_url) && (
                        <div className="aspect-video w-full overflow-hidden">
                          <img
                            src={post.thumbnail_image_url || post.featured_image_url}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                          {post.is_featured && (
                            <span className="px-2 py-1 text-xs font-bold bg-yellow-500/20 text-yellow-400 rounded">
                              مميز
                            </span>
                          )}
                          {post.category && (
                            <span className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded">
                              {post.category.name}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">
                          {post.title}
                        </h3>
                        <p className="text-white text-sm font-medium">
                          {formatArabicDate(post.published_at || post.created_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4">
                    {page > 1 && (
                      <Link
                        href={`/blog?page=${page - 1}`}
                        className="px-6 py-3 bg-gray-900/50 border border-yellow-500/20 text-yellow-400 rounded-lg hover:border-yellow-500/50 transition-all"
                      >
                        السابق
                      </Link>
                    )}
                    <span className="text-gray-400">
                      صفحة {page} من {totalPages}
                    </span>
                    {page < totalPages && (
                      <Link
                        href={`/blog?page=${page + 1}`}
                        className="px-6 py-3 bg-gray-900/50 border border-yellow-500/20 text-yellow-400 rounded-lg hover:border-yellow-500/50 transition-all"
                      >
                        التالي
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

