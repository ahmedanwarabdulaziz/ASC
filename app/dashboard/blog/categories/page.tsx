'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, AuthUser } from '@/lib/auth';
import Navigation from '@/components/Navigation';
import Button from '@/components/Button';
import { BlogCategory } from '@/types';

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  useEffect(() => {
    checkAuthAndLoadCategories();
  }, []);

  const checkAuthAndLoadCategories = async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setCurrentUser(user);
    await loadCategories();
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories((data || []) as BlogCategory[]);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تحميل التصنيفات');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^\u0600-\u06FF\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: editingCategory ? formData.slug : generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setError('');

      if (editingCategory) {
        // Update
        const { error } = await supabase
          .from('blog_categories')
          .update({
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('blog_categories')
          .insert({
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
          });

        if (error) throw error;
      }

      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '' });
      await loadCategories();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في حفظ التصنيف');
    }
  };

  const handleEdit = (category: BlogCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;

    try {
      const { error } = await supabase
        .from('blog_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadCategories();
    } catch (err: any) {
      alert('حدث خطأ في حذف التصنيف: ' + err.message);
    }
  };

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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">إدارة التصنيفات</h1>
          <Button
            onClick={() => {
              setEditingCategory(null);
              setFormData({ name: '', slug: '', description: '' });
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black"
          >
            تصنيف جديد
          </Button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-gray-900/50 border border-yellow-500/20 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingCategory ? 'تعديل التصنيف' : 'تصنيف جديد'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">الاسم</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">الرابط (Slug)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black"
                >
                  {editingCategory ? 'تحديث' : 'إنشاء'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCategory(null);
                    setFormData({ name: '', slug: '', description: '' });
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-gray-900/50 border border-yellow-500/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">الاسم</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">الرابط</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">الوصف</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 text-white">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-300">
                      لا توجد تصنيفات بعد
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-800/50 text-white">
                      <td className="px-6 py-4 text-white font-medium">{category.name}</td>
                      <td className="px-6 py-4 text-white text-sm">{category.slug}</td>
                      <td className="px-6 py-4 text-white text-sm">{category.description || '-'}</td>
                      <td className="px-6 py-4 text-white">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
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

        <div className="mt-8">
          <Button
            onClick={() => router.push('/dashboard/blog')}
            className="bg-gray-700 hover:bg-gray-600 text-white"
          >
            العودة لإدارة المدونة
          </Button>
        </div>
      </div>
    </div>
  );
}

