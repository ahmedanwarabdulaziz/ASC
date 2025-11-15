import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function About() {
  return (
    <div className="min-h-screen bg-black" dir="rtl">
      <Navigation />
      <main>
        {/* Hero Section */}
        <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-black via-gray-900 to-black"></div>
          
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

        {/* About Content Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-gray-900/50 border border-yellow-500/20 rounded-2xl p-8 md:p-12 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  من نحن
                </span>
              </h2>
              
              <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
                <p className="text-xl text-white font-semibold">
                  مرحباً بكم في صفحة ناجح البارودي
                </p>
                <p>
                  أنا ناجح البارودي، وأنا فخور بأن أكون مرشحاً لرئاسة مجلس إدارة نادي أسيوط الرياضي. 
                  أؤمن بقوة الرياضة في بناء المجتمع وتطوير الشباب.
                </p>
                <p>
                  هدفي هو تطوير النادي وتحسين خدماته لأعضائه ومجتمعه. أتطلع إلى العمل معاً 
                  لبناء مستقبل أفضل للنادي الرياضي.
                </p>
              </div>
            </div>

            {/* Vision Section */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-900/50 border border-yellow-500/20 rounded-xl p-8 hover:border-yellow-500/50 transition-all duration-300">
                <div className="text-yellow-500 text-4xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold text-white mb-4">رؤيتنا</h3>
                <p className="text-gray-400 leading-relaxed">
                  تطوير نادي أسيوط الرياضي ليصبح من أفضل الأندية الرياضية في المنطقة، 
                  مع التركيز على تطوير المواهب الشبابية وبناء مجتمع رياضي قوي.
                </p>
              </div>
              
              <div className="bg-gray-900/50 border border-yellow-500/20 rounded-xl p-8 hover:border-yellow-500/50 transition-all duration-300">
                <div className="text-yellow-500 text-4xl mb-4">💪</div>
                <h3 className="text-2xl font-bold text-white mb-4">رسالتنا</h3>
                <p className="text-gray-400 leading-relaxed">
                  العمل على تحسين البنية التحتية للنادي، وتطوير البرامج الرياضية، 
                  وخلق بيئة إيجابية تشجع على المشاركة والتميز الرياضي.
                </p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-12 text-center">
              <Link href="/" className="inline-block">
                <button className="px-10 py-4 bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-700 hover:from-yellow-600 hover:via-yellow-700 hover:to-yellow-800 text-black font-bold text-lg rounded-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-yellow-400">
                  العودة للصفحة الرئيسية
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

