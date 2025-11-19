'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, AuthUser } from '@/lib/auth';
import Navigation from '@/components/Navigation';
import Button from '@/components/Button';
import { BlogPost, BlogCategory } from '@/types';

export default function BlogManagementPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadPosts();
  }, []);

  const checkAuthAndLoadPosts = async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Only admins can manage blog
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setCurrentUser(user);
    await loadPosts();
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:users(id, email, display_name),
          category:blog_categories(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts((data || []) as BlogPost[]);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تحميل المقالات');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadPosts();
    } catch (err: any) {
      alert('حدث خطأ في حذف الصورة: ' + err.message);
    }
  };

  const handleToggleFeatured = async (post: BlogPost) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ is_featured: !post.is_featured })
        .eq('id', post.id);

      if (error) throw error;
      await loadPosts();
    } catch (err: any) {
      alert('حدث خطأ في تحديث الصورة: ' + err.message);
    }
  };

  const handleToggleStatus = async (post: BlogPost) => {
    try {
      const newStatus = post.status === 'published' ? 'draft' : 'published';
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'published' && !post.published_at) {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', post.id);

      if (error) throw error;
      await loadPosts();
    } catch (err: any) {
      alert('حدث خطأ في تحديث الصورة: ' + err.message);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black" dir="rtl">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center text-white">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black" dir="rtl">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">إدارة الصور</h1>
          <Link href="/dashboard/blog/new">
            <Button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black">
              صورة جديدة
            </Button>
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-gray-900/50 border border-yellow-500/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">العنوان</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">الحالة</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">مميز</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">التاريخ</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 text-white">
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-300">
                      لا توجد صور بعد
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-800/50 text-white">
                      <td className="px-6 py-4 text-white">
                        <div className="text-white font-medium">{post.title}</div>
                        {post.category && (
                          <div className="text-sm text-gray-300">{post.category.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-white">
                        <button
                          onClick={() => handleToggleStatus(post)}
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            post.status === 'published'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}
                        >
                          {post.status === 'published' ? 'منشور' : 'مسودة'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-white">
                        <button
                          onClick={() => handleToggleFeatured(post)}
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            post.is_featured
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}
                        >
                          {post.is_featured ? 'نعم' : 'لا'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {formatArabicDate(post.published_at || post.created_at)}
                      </td>
                      <td className="px-6 py-4 text-white">
                        <div className="flex gap-2">
                          <Link href={`/dashboard/blog/edit/${post.id}`}>
                            <button className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30">
                              تعديل
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <Link href="/dashboard/blog/categories">
            <Button className="bg-gray-700 hover:bg-gray-600 text-white">
              إدارة التصنيفات
            </Button>
          </Link>
          <Link href="/dashboard/blog/bio">
            <Button className="bg-gray-700 hover:bg-gray-600 text-white">
              تعديل السيرة الذاتية
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

