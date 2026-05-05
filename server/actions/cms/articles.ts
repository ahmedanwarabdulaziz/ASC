'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/server/permissions/require-permission';
import { revalidatePath } from 'next/cache';

const PERMISSIONS = {
  CMS_VIEW: 'cms.view',
  CMS_MANAGE: 'cms.manage',
  CMS_PUBLISH: 'cms.publish'
};

export async function getArticles() {
  await requirePermission(PERMISSIONS.CMS_VIEW as any);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cms_articles')
    .select(`
      *,
      cms_categories (name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching articles:', error);
    return { success: false, error: 'حدث خطأ أثناء جلب المقالات.' };
  }

  return { success: true, data: data || [] };
}

export async function saveArticle(formData: FormData) {
  await requirePermission(PERMISSIONS.CMS_MANAGE as any);
  const supabase = await createClient();
  
  const id = formData.get('id') as string;
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  const excerpt = formData.get('excerpt') as string;
  const coverImage = formData.get('coverImage') as string;
  const categoryId = formData.get('categoryId') as string;
  
  if (!title || !slug || !content) {
    return { success: false, error: 'العنوان، الرابط، والمحتوى حقول إجبارية.' };
  }

  // Get current user for author_id
  const { data: { user } } = await supabase.auth.getUser();

  const articleData = {
    title,
    slug,
    content,
    excerpt: excerpt || null,
    cover_image_url: coverImage || null,
    category_id: categoryId || null,
  };

  if (id) {
    // Update existing
    const { error } = await supabase
      .from('cms_articles')
      .update({ ...articleData, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error(error);
      return { success: false, error: error.code === '23505' ? 'هذا الرابط (Slug) مستخدم بالفعل.' : 'حدث خطأ أثناء التحديث.' };
    }
  } else {
    // Create new
    const { error } = await supabase
      .from('cms_articles')
      .insert({
        ...articleData,
        author_id: user?.id,
        status: 'draft'
      });

    if (error) {
      console.error(error);
      return { success: false, error: error.code === '23505' ? 'هذا الرابط (Slug) مستخدم بالفعل.' : 'حدث خطأ أثناء الإنشاء.' };
    }
  }

  revalidatePath('/system/cms/articles');
  return { success: true };
}

export async function toggleArticlePublish(id: string, publish: boolean) {
  await requirePermission(PERMISSIONS.CMS_PUBLISH as any);
  const supabase = await createClient();

  const { error } = await supabase
    .from('cms_articles')
    .update({ 
      status: publish ? 'published' : 'draft',
      published_at: publish ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error(error);
    return { success: false, error: 'حدث خطأ أثناء تغيير حالة النشر.' };
  }

  revalidatePath('/system/cms/articles');
  return { success: true };
}

export async function deleteArticle(id: string) {
  await requirePermission(PERMISSIONS.CMS_MANAGE as any);
  const supabaseAdmin = createAdminClient();

  const { error } = await supabaseAdmin
    .from('cms_articles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(error);
    return { success: false, error: 'حدث خطأ أثناء الحذف.' };
  }

  revalidatePath('/system/cms/articles');
  return { success: true };
}
