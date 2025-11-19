import Link from 'next/link';
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

export default async function Home() {
  const featuredPosts = await getFeaturedPosts();
  
  // Fetch secondary images for featured posts
  const featuredWithImages = await Promise.all(
    featuredPosts.map(async (post) => {
      const images = await getPostImages(post.id);
      return { post, images };
    })
  );
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

        {/* Building List Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
          <div className="container mx-auto max-w-7xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                  قائمة بناء
                </span>
              </h2>
              
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
                نبني اليوم لمستقبل يستحقه أعضاء النادي وأبناؤهم
              </h3>
              
              <p className="text-white text-lg md:text-xl leading-relaxed max-w-4xl mx-auto text-right">
                تأتي قائمة بناء لخوض انتخابات مجلس إدارة نادي أسيوط الرياضي إيمانًا منها بأن النادي هو بيت أعضائه، وأن الإصلاح والتطوير لا يتحققان إلا من خلال رؤية واضحة، وإدارة واعية، ومشاركة حقيقية من جميع الأعضاء. تسعى القائمة إلى إعادة القيمة الحقيقية للعضوية وتحسين الخدمات وتعظيم الموارد بما يليق بتاريخ النادي.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Image on the left */}
              <div className="order-2 lg:order-1">
                <img
                  src="/img/G-all.png"
                  alt="قائمة بناء"
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
              </div>

              {/* Content on the right */}
              <div className="order-1 lg:order-2 text-right space-y-6">

                <div className="mt-8 space-y-6">
                  <h4 className="text-2xl md:text-3xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                      المرشحون
                    </span>
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <p className="text-yellow-400 font-semibold text-lg mb-1">
                        ناجح محمد عبد الوهاب البارودي
                      </p>
                      <p className="text-white text-sm">وشهرته ناجح البارودي - مقعد رئيس مجلس الإدارة</p>
                    </div>

                    <div>
                      <p className="text-yellow-400 font-semibold text-lg mb-1">
                        احمد بهجت محمود فراج عيسى
                      </p>
                      <p className="text-white text-sm">وشهرته بهجت فراج - مقعد نائب رئيس مجلس الإدارة</p>
                    </div>

                    <div>
                      <p className="text-yellow-400 font-semibold text-lg mb-1">
                        احمد طه عبد الصادق حسانين
                      </p>
                      <p className="text-white text-sm">وشهرته احمد طه - مقعد امين الصندوق</p>
                    </div>

                    <div className="mt-6">
                      <p className="text-yellow-400 font-semibold text-lg mb-4">مقاعد الأعضاء:</p>
                      <div className="space-y-3 pr-4">
                        <div>
                          <p className="text-yellow-400 font-semibold text-base mb-1">
                            ابوعلى حامد محمد المليجي
                          </p>
                          <p className="text-white text-sm">وشهرته ابوعلي حامد المليجي - مقعد عضو مجلس الادارة</p>
                        </div>
                        <div>
                          <p className="text-yellow-400 font-semibold text-base mb-1">
                            احمد حمدي محمد جابر
                          </p>
                          <p className="text-white text-sm">وشهرته كابتن احمد حمدي - مقعد عضو مجلس الادارة</p>
                        </div>
                        <div>
                          <p className="text-yellow-400 font-semibold text-base mb-1">
                            ريهام عبد الفتاح على رضا
                          </p>
                          <p className="text-white text-sm">وشهرتها ريهام عبد الفتاح غلاب السليني - مقعد عضو مجلس الادارة</p>
                        </div>
                        <div>
                          <p className="text-yellow-400 font-semibold text-base mb-1">
                            محمود عبد العزيز محمود
                          </p>
                          <p className="text-white text-sm">وشهرته كابتن زيزو - مقعد عضو مجلس الادارة</p>
                        </div>
                        <div>
                          <p className="text-yellow-400 font-semibold text-base mb-1">
                            هيثم عبد السلام احمد همام
                          </p>
                          <p className="text-white text-sm">وشهرته هيثم عبد السلام - مقعد عضو مجلس الادارة</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <p className="text-yellow-400 font-semibold text-lg mb-4">مقاعد الأعضاء تحت سن ٣٥:</p>
                      <div className="space-y-3 pr-4">
                        <div>
                          <p className="text-yellow-400 font-semibold text-base mb-1">
                            محمود جمال عبد الرؤوف عبد العزيز
                          </p>
                          <p className="text-white text-sm">وشهرته محمود جمال عبد الرؤوف - مقعد عضو مجلس الاداره تحت السن</p>
                        </div>
                        <div>
                          <p className="text-yellow-400 font-semibold text-base mb-1">
                            مصطفى محمد حسين حسين
                          </p>
                          <p className="text-white text-sm">وشهرته مصطفى سليم - مقعد عضو مجلس الإدارة تحت السن</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Gallery Section */}
        {featuredWithImages.length > 0 && (
          <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  شاركنا اهم الاحداث مع ناجح البارودي
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {featuredWithImages.map(({ post, images }) => (
                  <GalleryCard key={post.id} post={post} secondaryImages={images} />
                ))}
              </div>
              <div className="text-center">
                <Link href="/blog" className="inline-block">
                  <button className="px-10 py-4 bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-700 hover:from-yellow-600 hover:via-yellow-700 hover:to-yellow-800 text-black font-bold text-lg rounded-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-yellow-400">
                    عرض جميع الصور
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

