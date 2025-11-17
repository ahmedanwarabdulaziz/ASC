'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, AuthUser } from '@/lib/auth';
import Navigation from '@/components/Navigation';
import Button from '@/components/Button';
import { BlogCategory, BlogPost } from '@/types';
import { uploadBlogImage, savePostImages, deletePostImages } from '@/lib/blog-utils';

export default function EditPostPage() {
  const params = useParams();
  const postId = params.id as string;
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category_id: '',
    featured_image_url: '',
    thumbnail_image_url: '',
    meta_description: '',
    og_image_url: '',
    is_featured: false,
    status: 'draft' as 'draft' | 'published',
    published_at: '', // Custom date for old articles
  });

  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingContent, setUploadingContent] = useState(false);
  const featuredFileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailFileInputRef = useRef<HTMLInputElement>(null);
  const contentImagesFileInputRef = useRef<HTMLInputElement>(null);
  
  // Multiple images for article content
  const [contentImages, setContentImages] = useState<Array<{ id: string; image_url: string; alt_text: string; order_index: number }>>([]);

  useEffect(() => {
    checkAuthAndLoadData();
  }, [postId]);

  const checkAuthAndLoadData = async () => {
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
    await Promise.all([loadPost(), loadCategories()]);
    setLoading(false);
  };

  const loadPost = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      if (!data) {
        router.push('/dashboard/blog');
        return;
      }

      setPost(data as BlogPost);
      
      // Format published_at for datetime-local input
      let publishedAtFormatted = '';
      if (data.published_at) {
        const date = new Date(data.published_at);
        publishedAtFormatted = date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
      }
      
      setFormData({
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || '',
        category_id: data.category_id || '',
        featured_image_url: data.featured_image_url || '',
        thumbnail_image_url: data.thumbnail_image_url || '',
        meta_description: data.meta_description || '',
        og_image_url: data.og_image_url || '',
        is_featured: data.is_featured || false,
        status: data.status as 'draft' | 'published',
        published_at: publishedAtFormatted,
      });

      // Load existing content images
      const { data: imagesData, error: imagesError } = await supabase
        .from('blog_post_images')
        .select('*')
        .eq('post_id', postId)
        .order('order_index', { ascending: true });

      if (!imagesError && imagesData) {
        setContentImages(
          imagesData.map((img: any) => ({
            id: img.id,
            image_url: img.image_url,
            alt_text: img.alt_text || '',
            order_index: img.order_index,
          }))
        );
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تحميل المقالة');
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories((data || []) as BlogCategory[]);
    } catch (err: any) {
      console.error('Error loading categories:', err);
    }
  };

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFeatured(true);
      const url = await uploadBlogImage(file, 'featured');
      setFormData({ ...formData, featured_image_url: url });
    } catch (err: any) {
      setError(err.message || 'فشل رفع الصورة المميزة');
    } finally {
      setUploadingFeatured(false);
      if (featuredFileInputRef.current) {
        featuredFileInputRef.current.value = '';
      }
    }
  };

  const handleThumbnailImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingThumbnail(true);
      const url = await uploadBlogImage(file, 'thumbnails');
      setFormData({ ...formData, thumbnail_image_url: url });
    } catch (err: any) {
      setError(err.message || 'فشل رفع الصورة المصغرة');
    } finally {
      setUploadingThumbnail(false);
      if (thumbnailFileInputRef.current) {
        thumbnailFileInputRef.current.value = '';
      }
    }
  };

  const handleContentImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingContent(true);
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const url = await uploadBlogImage(file, 'content');
        return {
          id: `temp-${Date.now()}-${index}`,
          image_url: url,
          alt_text: '',
          order_index: contentImages.length + index,
        };
      });

      const newImages = await Promise.all(uploadPromises);
      setContentImages([...contentImages, ...newImages]);
    } catch (err: any) {
      setError(err.message || 'فشل رفع الصور');
    } finally {
      setUploadingContent(false);
      if (contentImagesFileInputRef.current) {
        contentImagesFileInputRef.current.value = '';
      }
    }
  };

  const removeContentImage = (id: string) => {
    setContentImages(contentImages.filter(img => img.id !== id).map((img, index) => ({
      ...img,
      order_index: index,
    })));
  };

  const updateImageAltText = (id: string, alt_text: string) => {
    setContentImages(contentImages.map(img =>
      img.id === id ? { ...img, alt_text } : img
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setSaving(true);
      setError('');

      // Determine published_at date
      let publishedAt: string | null = null;
      if (formData.status === 'published') {
        if (formData.published_at) {
          // Use custom date if provided
          publishedAt = new Date(formData.published_at).toISOString();
        } else if (post && post.published_at) {
          // Keep existing date if no new date provided
          publishedAt = post.published_at;
        } else {
          // Use current date if no date exists
          publishedAt = new Date().toISOString();
        }
      }

      const updateData: any = {
        ...formData,
        category_id: formData.category_id || null,
        published_at: publishedAt,
      };

      // Remove published_at from formData (it's not a column)
      delete updateData.published_at;
      updateData.published_at = publishedAt;

      const { error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', postId);

      if (error) throw error;

      // Update content images - delete all and re-insert
      await deletePostImages(postId);
      if (contentImages.length > 0) {
        await savePostImages(
          postId,
          contentImages.map(img => ({
            image_url: img.image_url,
            alt_text: img.alt_text,
            order_index: img.order_index,
          }))
        );
      }

      router.push('/dashboard/blog');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في حفظ المقالة');
    } finally {
      setSaving(false);
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

  if (!post) {
    return (
      <div className="min-h-screen bg-black" dir="rtl">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center text-white">المقالة غير موجودة</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black" dir="rtl">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">تعديل المقالة</h1>
          <p className="text-gray-400">قم بتعديل المقالة</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-yellow-500/20 rounded-xl p-8 space-y-6">
          <div>
            <label className="block text-white font-semibold mb-2">العنوان *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              required
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">المحتوى *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              rows={15}
              required
              placeholder="اكتب محتوى المقالة هنا... (سيتم استبدال هذا بمحرر نصوص متقدم قريباً)"
            />
            <p className="text-gray-500 text-sm mt-2">ملاحظة: سيتم استبدال هذا الحقل بمحرر نصوص متقدم (TipTap) قريباً</p>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">الملخص</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              rows={3}
              placeholder="ملخص قصير للمقالة (يظهر في البطاقات)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">التصنيف</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:border-yellow-500"
              >
                <option value="">بدون تصنيف</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">الحالة</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:border-yellow-500"
              >
                <option value="draft">مسودة</option>
                <option value="published">منشور</option>
              </select>
            </div>
          </div>

          {formData.status === 'published' && (
            <div>
              <label className="block text-white font-semibold mb-2">تاريخ النشر (للمقالات القديمة)</label>
              <input
                type="datetime-local"
                value={formData.published_at}
                onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                placeholder="اتركه فارغاً لاستخدام التاريخ الحالي"
              />
              <p className="text-gray-500 text-sm mt-2">اتركه فارغاً لاستخدام التاريخ الحالي، أو اختر تاريخاً للمقالات القديمة</p>
            </div>
          )}

          {/* Multiple Images Section */}
          <div>
            <label className="block text-white font-semibold mb-2">صور المقالة (يمكن رفع عدة صور)</label>
            <input
              ref={contentImagesFileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleContentImagesUpload}
              className="hidden"
            />
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                onClick={() => contentImagesFileInputRef.current?.click()}
                disabled={uploadingContent}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {uploadingContent ? 'جاري الرفع...' : 'رفع صور'}
              </Button>
              <span className="text-gray-400 text-sm self-center">
                {contentImages.length > 0 && `(${contentImages.length} صورة)`}
              </span>
            </div>

            {/* Display uploaded images */}
            {contentImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {contentImages.map((img) => (
                  <div key={img.id} className="relative bg-gray-800 rounded-lg p-2 border border-gray-700">
                    <img
                      src={img.image_url}
                      alt={img.alt_text || 'Preview'}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                    <input
                      type="text"
                      value={img.alt_text}
                      onChange={(e) => updateImageAltText(img.id, e.target.value)}
                      placeholder="نص بديل للصورة"
                      className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-black text-sm placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeContentImage(img.id)}
                      className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">الصورة المميزة</label>
              <input
                ref={featuredFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFeaturedImageUpload}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => featuredFileInputRef.current?.click()}
                  disabled={uploadingFeatured}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {uploadingFeatured ? 'جاري الرفع...' : 'رفع صورة'}
                </Button>
                {formData.featured_image_url && (
                  <div className="flex-1">
                    <img
                      src={formData.featured_image_url}
                      alt="Preview"
                      className="h-20 w-auto rounded border border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, featured_image_url: '' })}
                      className="text-red-400 text-sm mt-1"
                    >
                      حذف
                    </button>
                  </div>
                )}
              </div>
              <input
                type="url"
                value={formData.featured_image_url}
                onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                className="w-full mt-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-yellow-500 text-sm"
                placeholder="أو أدخل الرابط يدوياً"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">الصورة المصغرة</label>
              <input
                ref={thumbnailFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailImageUpload}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => thumbnailFileInputRef.current?.click()}
                  disabled={uploadingThumbnail}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {uploadingThumbnail ? 'جاري الرفع...' : 'رفع صورة'}
                </Button>
                {formData.thumbnail_image_url && (
                  <div className="flex-1">
                    <img
                      src={formData.thumbnail_image_url}
                      alt="Preview"
                      className="h-20 w-auto rounded border border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, thumbnail_image_url: '' })}
                      className="text-red-400 text-sm mt-1"
                    >
                      حذف
                    </button>
                  </div>
                )}
              </div>
              <input
                type="url"
                value={formData.thumbnail_image_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_image_url: e.target.value })}
                className="w-full mt-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-yellow-500 text-sm"
                placeholder="أو أدخل الرابط يدوياً"
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">وصف SEO</label>
            <textarea
              value={formData.meta_description}
              onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              rows={2}
              placeholder="وصف قصير للمقالة (للمحركات البحث)"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-yellow-500 focus:ring-yellow-500"
              />
              <span className="text-white">مقال مميز</span>
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
            <Button
              type="button"
              onClick={() => router.push('/dashboard/blog')}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

