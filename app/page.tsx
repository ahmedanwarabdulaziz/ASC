import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { BlogPost } from '@/types';

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

export default async function Home() {
  const featuredPosts = await getFeaturedPosts();
  return (
    <div className="min-h-screen bg-black" dir="rtl">
      <Navigation />
      <main>
        {/* Hero Section */}
        <section className="relative w-full h-[600px] md:h-[700px] overflow-hidden bg-black">
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
            <div className="text-center max-w-4xl pt-20 md:pt-32">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
                ناجح البارودي
              </h1>
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-8 leading-tight">
                <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                  مرشح رئاسة مجلس ادارة نادي اسيوط الرياضي
                </span>
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/login" className="inline-block">
                  <button className="px-10 py-4 bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-700 hover:from-yellow-600 hover:via-yellow-700 hover:to-yellow-800 text-black font-bold text-lg rounded-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-yellow-400">
                    دخول اعضاء الحملة الانتخابية
                  </button>
                </Link>
                <Link href="/about" className="inline-block">
                  <button className="px-10 py-4 bg-transparent border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black font-bold text-lg rounded-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                    المزيد عن ناجح البارودي
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why Section */}
        <section className="py-20 px-4 bg-black">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                لماذا ناجح البارودي
              </span>
            </h2>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-12 leading-tight">
              لرئاسة نادي اسيوط الرياضي
            </h3>
            
            <div className="text-right space-y-6 text-white text-lg md:text-xl leading-relaxed">
              <p className="text-gray-200">
                في ظل المرحلة الحرجة التي يمر بها نادي أسيوط الرياضي، يؤمن ناجح البارودي بأن الحفاظ على تاريخ هذا النادي العريق مسؤولية جماعية تستند إلى الإخلاص والمثابرة والإصرار. ومن هذا المنطلق، قرر الترشح لرئاسة مجلس إدارة النادي، واضعًا نصب عينيه هدفًا واضحًا: إعادة نادي أسيوط إلى مكانته المرموقة ومجده الرياضي والثقافي.
              </p>
              
              <p className="text-gray-200">
                يرى ناجح البارودي أن قضية "أرض النادي" تمثل حجر الأساس لأي مسار إصلاحي أو تطويري، وأن معالجتها تمثل الخطوة الأولى نحو مستقبل أكثر استقرارًا واستدامة. لذلك جعل من إنهاء مشكلة سحب أرض النادي وسداد المتأخرات المالية أولوية قصوى ضمن برنامجه الانتخابي.
              </p>
              
              <p className="text-gray-200">
                يؤمن ناجح بأن النجاح لا يتحقق إلا بالعمل المنظم والرؤية الواضحة، وقد اطّلع بعناية على جميع البرامج والمقترحات الانتخابية للمرشحين الآخرين، مقدّرًا ما تحمله من أفكار طموحة تستشرف مستقبلًا واعدًا للنادي خلال السنوات القادمة. ومع ذلك، فهو يرى أن جميع تلك المبادرات تبقى رهينة حلّ الأزمة الأساسية المتعلقة بأرض النادي، ويدعو إلى وضع جدول زمني مدروس لتطبيق خطط التطوير فور استقرار هذا الملف.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Articles Section */}
        {featuredPosts.length > 0 && (
          <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  شاركنا اهم الاحداث مع ناجح البارودي
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <div className="text-center">
                <Link href="/blog" className="inline-block">
                  <button className="px-10 py-4 bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-700 hover:from-yellow-600 hover:via-yellow-700 hover:to-yellow-800 text-black font-bold text-lg rounded-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-yellow-400">
                    عرض جميع المقالات
                  </button>
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

