import Navigation from '@/components/Navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { BlogPost, BlogPostImage } from '@/types';
import GalleryCard from '@/components/GalleryCard';

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

async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select(`
        *,
        author:users(id, email, display_name),
        category:blog_categories(*)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
    return (data || []) as BlogPost[];
  } catch (err) {
    console.error('Exception fetching posts:', err);
    return [];
  }
}

async function getPostImages(postId: string): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('blog_post_images')
      .select('*')
      .eq('post_id', postId)
      .order('order_index', { ascending: true });

    if (error) return [];
    return (data || []);
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
    calendar: 'gregory'
  }).format(date);
}

export default async function BlogPage() {
  const featuredPosts = await getFeaturedPosts();
  const allPosts = await getAllPosts();
  
  // Fetch secondary images for all posts
  const postsWithImages = await Promise.all(
    allPosts.map(async (post) => {
      const images = await getPostImages(post.id);
      return { post, images: images as BlogPostImage[] };
    })
  );

  // Separate featured and regular posts
  const featuredPostIds = new Set(featuredPosts.map(p => p.id));
  const regularPosts = postsWithImages.filter(({ post }) => !featuredPostIds.has(post.id));
  const featuredWithImages = await Promise.all(
    featuredPosts.map(async (post) => {
      const images = await getPostImages(post.id);
      return { post, images: images as BlogPostImage[] };
    })
  );

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

        {/* Featured Gallery Section */}
        {featuredWithImages.length > 0 && (
          <section className="py-20 px-4 bg-black">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  شاركنا اهم الاحداث مع ناجح البارودي
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredWithImages.map(({ post, images }) => (
                  <GalleryCard key={post.id} post={post} secondaryImages={images} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Gallery Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                جميع الصور
              </span>
            </h2>
            
            {regularPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">لا توجد صور متاحة حالياً</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularPosts.map(({ post, images }) => (
                  <GalleryCard key={post.id} post={post} secondaryImages={images} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

