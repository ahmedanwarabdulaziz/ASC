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
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching featured posts:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return [];
    }
    if (!data) return [];
    console.log(`Fetched ${data.length} featured posts`);
    return data as BlogPost[];
  } catch (err) {
    console.error('Exception fetching featured posts:', err);
    return [];
  }
}

async function getAllPosts(): Promise<BlogPost[]> {
  try {
    // Fetch all published posts - no pagination
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
      console.error('Error fetching all posts:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Fallback: try without joins
      console.log('Attempting fallback query without joins...');
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
      
      if (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return [];
      }
      
      console.log(`Fallback: Fetched ${fallbackData?.length || 0} published posts`);
      return (fallbackData || []) as BlogPost[];
    }
    
    console.log(`Fetched ${data?.length || 0} published posts`);
    if (data && data.length > 0) {
      console.log('Sample post:', JSON.stringify(data[0], null, 2));
    }
    return (data || []) as BlogPost[];
  } catch (err) {
    console.error('Exception fetching all posts:', err);
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

export default async function About() {
  
  // Debug: Check all posts in database
  const { data: allPostsDebug, error: debugError } = await supabaseAdmin
    .from('blog_posts')
    .select('id, title, status, published_at, is_featured')
    .order('created_at', { ascending: false });
  
  if (!debugError && allPostsDebug) {
    console.log('=== DEBUG: All posts in database ===');
    console.log(`Total posts: ${allPostsDebug.length}`);
    console.log('Published posts:', allPostsDebug.filter(p => p.status === 'published').length);
    console.log('Draft posts:', allPostsDebug.filter(p => p.status === 'draft').length);
    allPostsDebug.forEach((post: any) => {
      console.log(`- ${post.title}: status=${post.status}, published_at=${post.published_at}, featured=${post.is_featured}`);
    });
    console.log('=====================================');
  }
  
  const featuredPosts = await getFeaturedPosts();
  const allPosts = await getAllPosts();
  
  console.log(`Total featured posts: ${featuredPosts.length}`);
  console.log(`Total all posts: ${allPosts.length}`);
  
  // Fetch secondary images for all posts
  async function getPostImages(postId: string): Promise<BlogPostImage[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('blog_post_images')
        .select('*')
        .eq('post_id', postId)
        .order('order_index', { ascending: true });
      if (error) return [];
      return (data || []) as BlogPostImage[];
    } catch {
      return [];
    }
  }

  const featuredWithImages = await Promise.all(
    featuredPosts.map(async (post) => {
      const images = await getPostImages(post.id);
      return { post, images };
    })
  );

  const allPostsWithImages = await Promise.all(
    allPosts.map(async (post) => {
      const images = await getPostImages(post.id);
      return { post, images };
    })
  );

  return (
    <div className="min-h-screen bg-black" dir="rtl">
      <Navigation />
      <main>
        {/* Hero Section */}
        <section className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden bg-black">
          <picture className="absolute top-0 left-0 w-full h-full z-0">
            <source media="(min-width: 768px)" srcSet="/img/Nageh%20Hero%20web.jpg" />
            <img
              src="/img/nageh-hero.jpg"
              alt="Hero Background"
              className="w-full h-full object-cover"
            />
          </picture>
          
          <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center">
            <div className="text-center max-w-4xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                ناجح البارودي
              </h1>
            </div>
          </div>
        </section>

        {/* About Content Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
          <div className="container mx-auto max-w-5xl">
            {/* Introduction Paragraph */}
            <div className="mb-16 bg-gray-900/50 border border-yellow-500/20 rounded-2xl p-8 md:p-12 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-8">
                <div className="order-2 md:order-1">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                    <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                      ناجح محمد عبد الوهاب البارودي
                    </span>
                  </h2>
                  <p className="text-white text-lg leading-relaxed">
                    رائد أعمال وشخصية عامة مؤثرة في مجالات التأمين، الصناعة، السياحة، والاستثمار، ومن أبرز الوجوه البارزة في صعيد مصر خلال العقود الثلاثة الأخيرة.
                  </p>
                </div>
                <div className="order-1 md:order-2">
                  <div className="w-full aspect-square bg-gray-800 rounded-xl flex items-center justify-center border border-yellow-500/20 overflow-hidden">
                    <img src="/img/N1.png" alt="ناجح محمد عبد الوهاب البارودي" className="w-full h-full object-contain rounded-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Family Background Paragraph */}
            <div className="mb-16 bg-gray-900/50 border border-yellow-500/20 rounded-2xl p-8 md:p-12 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-full aspect-square bg-gray-800 rounded-xl flex items-center justify-center border border-yellow-500/20 overflow-hidden">
                    <img src="/img/N2.png" alt="عائلة البارودي" className="w-full h-full object-contain rounded-xl" />
                  </div>
                </div>
                <div>
                  <p className="text-white text-lg leading-relaxed">
                    ينتمي البارودي إلى عائلة البارودي، إحدى العائلات المصرية العريقة المنتشرة في مختلف محافظات الجمهورية. وهو حاصل على ليسانس أصول الدين – جامعة الأزهر، إضافة إلى مجموعة من الدبلومات المهنية المتقدمة في مجالات التسويق، الإدارة، وتنمية المهارات، التي أسهمت في تعزيز خبراته القيادية وبناء مسيرته المتنوعة.
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Experience Start */}
            <div className="mb-16 bg-gray-900/50 border border-yellow-500/20 rounded-2xl p-8 md:p-12 shadow-2xl">
              <h3 className="text-2xl md:text-3xl font-bold text-yellow-500 mb-6">خبرة مهنية بارزة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-white text-lg leading-relaxed">
                    بدأ ناجح البارودي مسيرته المهنية في قطاع التأمين منذ عام 1991، حيث التحق بشركة قناة السويس للتأمين وتدرّج حتى منصب مراقب عام الشركة على مستوى محافظات الصعيد.
                  </p>
                </div>
                <div>
                  <div className="w-full aspect-square bg-gray-800 rounded-xl flex items-center justify-center border border-yellow-500/20 overflow-hidden">
                    <img src="/img/N3.png" alt="خبرة مهنية بارزة" className="w-full h-full object-contain rounded-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Insurance Career */}
            <div className="mb-16 bg-gray-900/50 border border-yellow-500/20 rounded-2xl p-8 md:p-12 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-full aspect-square bg-gray-800 rounded-xl flex items-center justify-center border border-yellow-500/20 overflow-hidden">
                    <img src="/img/n4.png" alt="التأمين" className="w-full h-full object-contain rounded-xl" />
                  </div>
                </div>
                <div>
                  <p className="text-white text-lg leading-relaxed">
                    أشرف على أكثر من 1500 موظف، وتولى متابعة ملفات التأمين لعدد من المؤسسات الكبرى في قطاعات التنمية والائتمان الزراعي. حصل خلال عمله على درع التفوق للمراقب العام الأول لمدة 20 سنة متتالية، وهو إنجاز غير مسبوق داخل القطاع.
                  </p>
                </div>
              </div>
            </div>

            {/* Investment and Industry */}
            <div className="mb-16 bg-gray-900/50 border border-yellow-500/20 rounded-2xl p-8 md:p-12 shadow-2xl">
              <h3 className="text-2xl md:text-3xl font-bold text-yellow-500 mb-6">الاستثمار والصناعة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-gray-300 text-lg leading-relaxed mb-4">
                    للبارودي حضور استثماري مهم في القطاع الصناعي، حيث أسس وشارك في إدارة مشروعات صناعية ناجحة، أبرزها:
                  </p>
                  <ul className="text-white text-lg leading-relaxed space-y-2 list-disc list-inside">
                    <li>إنشاء أول مصنع للعصائر والآيس كريم عام 1999 تحت اسم شركة البارودي للعصائر والآيس كريم.</li>
                    <li>تطوير مشروعات صناعية وتجارية متنوعة توسعت لتشمل قطاعات الضيافة، الأغذية، والخدمات السياحية.</li>
                    <li>المساهمة في إحياء مسار الصناعة المحلية في أسيوط عبر دعم المشروعات الصغيرة والمتوسطة وإيجاد فرص عمل مستدامة.</li>
                  </ul>
                  <p className="text-gray-300 text-lg leading-relaxed mt-4">
                    يمتاز البارودي برؤية استثمارية تقوم على الدمج بين الصناعة والسياحة والخدمات، وهو ما جعله من أكثر رجال الأعمال تأثيرًا في محافظات الصعيد.
                  </p>
                </div>
                <div>
                  <div className="w-full aspect-square bg-gray-800 rounded-xl flex items-center justify-center border border-yellow-500/20 overflow-hidden">
                    <img src="/img/n5.png" alt="الاستثمار والصناعة" className="w-full h-full object-contain rounded-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tourism Projects */}
            <div className="mb-16 bg-gray-900/50 border border-yellow-500/20 rounded-2xl p-8 md:p-12 shadow-2xl">
              <h3 className="text-2xl md:text-3xl font-bold text-yellow-500 mb-6">المشروعات السياحية والفندقية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-full aspect-square bg-gray-800 rounded-xl flex items-center justify-center border border-yellow-500/20 overflow-hidden">
                    <img src="/img/n6.png" alt="المشروعات السياحية والفندقية" className="w-full h-full object-contain rounded-xl" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-300 text-lg leading-relaxed mb-4">
                    يُعد البارودي من أبرز رواد تنمية السياحة في محافظات الصعيد، ومن أهم إنجازاته:
                  </p>
                  <ul className="text-white text-lg leading-relaxed space-y-2 list-disc list-inside">
                    <li>مالك ورئيس مجلس إدارة شركة روز للمنشآت السياحية المالكة لفندق ميس إيجيبت العائم – 5 نجوم.</li>
                    <li>تأسيس أول مطاعم سياحية عائمة في أسيوط هابي دولفين عام 2003.</li>
                    <li>تأسيس مطاعم الداون تاون عام 2009، وتوظيف أكثر من 500 عامل في قطاع السياحة.</li>
                    <li>إدارة فنادق فاخرة 5 نجوم مثل: الباخرة ستيفاني – الباخرة أوبرا.</li>
                    <li>نيله لقب رجل السياحة الأول في أسيوط مرتين في عهد اللواء نبيل العزبي واللواء إبراهيم حماد.</li>
                    <li>إنشاء وإدارة منتجع رود هاوس السياحي بالقاهرة منذ 2013 وحتى 2020.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Community Work */}
            <div className="mb-16 bg-gray-900/50 border border-yellow-500/20 rounded-2xl p-8 md:p-12 shadow-2xl">
              <h3 className="text-2xl md:text-3xl font-bold text-yellow-500 mb-6">العمل العام والمسؤولية المجتمعية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-gray-300 text-lg leading-relaxed mb-4">
                    يتمتع ناجح البارودي بحضور فعال في المجال المجتمعي والإنساني، وقد شارك في رعاية ودعم العديد من المبادرات الوطنية، منها:
                  </p>
                  <ul className="text-white text-lg leading-relaxed space-y-2 list-disc list-inside">
                    <li>مبادرات حياة كريمة ومشروعات التنمية في جنوب مصر.</li>
                    <li>رعاية أسبوع ملتقى الشعوب – جامعة أسيوط.</li>
                    <li>دعم الزفاف الجماعي السنوي بمحافظة أسيوط.</li>
                    <li>رعاية اليوبيل الفضي لجامعة جنوب مصر للأورام.</li>
                    <li>مشاركات بارزة مع مؤسسات المجتمع المدني، وحصوله على وسام محافظة أسيوط وتكريمات دولية ومحلية متعددة.</li>
                  </ul>
                </div>
                <div>
                  <div className="w-full aspect-square bg-gray-800 rounded-xl flex items-center justify-center border border-yellow-500/20 overflow-hidden">
                    <img src="/img/n8.png" alt="العمل العام والمسؤولية المجتمعية" className="w-full h-full object-contain rounded-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Media Presence */}
            <div className="mb-16 bg-gray-900/50 border border-yellow-500/20 rounded-2xl p-8 md:p-12 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-full aspect-square bg-gray-800 rounded-xl flex items-center justify-center border border-yellow-500/20 overflow-hidden">
                    <img src="/img/n7.png" alt="علامة إعلامية وشخصية عامة" className="w-full h-full object-contain rounded-xl" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-yellow-500 mb-6">علامة إعلامية وشخصية عامة</h3>
                  <p className="text-white text-lg leading-relaxed">
                    بفضل مسيرته الطويلة وإنجازاته في التأمين، الصناعة، السياحة، والتنمية المجتمعية، أصبح ناجح البارودي شخصية إعلامية معروفة يُستضاف في العديد من الفعاليات والبرامج المتخصصة باعتباره نموذجًا للقيادة الفعالة والتنمية في الصعيد.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Gallery Section */}
        <section className="py-20 px-4 bg-black">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                شاركنا اهم الاحداث مع ناجح البارودي
              </span>
            </h2>
            {featuredWithImages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">لا توجد صور مميزة حالياً</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredWithImages.map(({ post, images }) => (
                  <GalleryCard key={post.id} post={post} secondaryImages={images} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* All Gallery Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                جميع الصور
              </span>
            </h2>
            
            {allPostsWithImages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">لا توجد صور متاحة حالياً</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allPostsWithImages.map(({ post, images }) => (
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

