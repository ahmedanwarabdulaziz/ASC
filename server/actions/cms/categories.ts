'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import { revalidatePath } from 'next/cache';

const PERMISSIONS = {
  CMS_VIEW: 'cms.view',
  CMS_MANAGE: 'cms.manage',
};

export async function getCategories() {
  await requirePermission(PERMISSIONS.CMS_VIEW as any);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cms_categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return { success: false, error: 'حدث خطأ أثناء جلب التصنيفات.' };
  }

  return { success: true, data: data || [] };
}

export async function saveCategory(formData: FormData) {
  await requirePermission(PERMISSIONS.CMS_MANAGE as any);
  const supabase = await createClient();
  
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const description = formData.get('description') as string;
  
  if (!name || !slug) {
    return { success: false, error: 'الاسم والرابط حقول إجبارية.' };
  }

  const categoryData = {
    name,
    slug,
    description: description || null,
  };

  if (id) {
    // Update existing
    const { error } = await supabase
      .from('cms_categories')
      .update({ ...categoryData, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error(error);
      return { success: false, error: error.code === '23505' ? 'هذا الاسم أو الرابط مستخدم بالفعل.' : 'حدث خطأ أثناء التحديث.' };
    }
  } else {
    // Create new
    const { error } = await supabase
      .from('cms_categories')
      .insert(categoryData);

    if (error) {
      console.error(error);
      return { success: false, error: error.code === '23505' ? 'هذا الاسم أو الرابط مستخدم بالفعل.' : 'حدث خطأ أثناء الإنشاء.' };
    }
  }

  revalidatePath('/system/cms/categories');
  return { success: true };
}

export async function deleteCategory(id: string) {
  await requirePermission(PERMISSIONS.CMS_MANAGE as any);
  const supabase = await createClient();

  const { error } = await supabase
    .from('cms_categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(error);
    return { success: false, error: 'حدث خطأ أثناء الحذف. تأكد من عدم ارتباط التصنيف بمقالات.' };
  }

  revalidatePath('/system/cms/categories');
  return { success: true };
}
