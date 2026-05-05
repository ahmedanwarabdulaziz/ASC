'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/server/permissions/require-permission';
import { revalidatePath } from 'next/cache';

const PERMISSIONS = {
  CMS_VIEW: 'cms.view',
  CMS_MANAGE: 'cms.manage',
};

export async function getMedia() {
  await requirePermission(PERMISSIONS.CMS_VIEW as any);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cms_media')
    .select(`
      *
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching media:', error);
    return { success: false, error: 'حدث خطأ أثناء جلب الوسائط.' };
  }

  return { success: true, data: data || [] };
}

export async function uploadMedia(formData: FormData) {
  await requirePermission(PERMISSIONS.CMS_MANAGE as any);
  const supabase = await createClient();
  
  const file = formData.get('file') as File;
  if (!file) {
    return { success: false, error: 'الرجاء اختيار ملف.' };
  }

  const { data: { user } } = await supabase.auth.getUser();

  // 1. Upload to Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  
  const { data: storageData, error: storageError } = await supabase.storage
    .from('public_media')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (storageError) {
    console.error('Storage upload error:', storageError);
    return { success: false, error: 'حدث خطأ أثناء رفع الملف.' };
  }

  // 2. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('public_media')
    .getPublicUrl(fileName);

  // 3. Save to cms_media table
  let mediaType = 'other';
  if (file.type.startsWith('image/')) mediaType = 'image';
  else if (file.type.startsWith('video/')) mediaType = 'video';
  else if (file.type.includes('pdf') || file.type.includes('document')) mediaType = 'document';

  const { error: dbError } = await supabase
    .from('cms_media')
    .insert({
      file_name: file.name,
      file_url: publicUrl,
      media_type: mediaType,
      file_size_bytes: file.size,
      uploaded_by: user?.id
    });

  if (dbError) {
    console.error('DB Insert error:', dbError);
    return { success: false, error: 'تم رفع الملف ولكن حدث خطأ في تسجيله في قاعدة البيانات.' };
  }

  revalidatePath('/system/cms/media');
  return { success: true, url: publicUrl };
}

export async function deleteMedia(id: string, fileUrl: string) {
  await requirePermission(PERMISSIONS.CMS_MANAGE as any);
  const supabase = await createClient();

  // Extract filename from URL
  const urlParts = fileUrl.split('/');
  const fileName = urlParts[urlParts.length - 1];

  // 1. Delete from Storage
  const { error: storageError } = await supabase.storage
    .from('public_media')
    .remove([fileName]);

  if (storageError) {
    console.error('Storage delete error:', storageError);
    // Continue anyway to clean up DB
  }

  // 2. Delete from DB
  const { error: dbError } = await supabase
    .from('cms_media')
    .delete()
    .eq('id', id);

  if (dbError) {
    console.error('DB delete error:', dbError);
    return { success: false, error: 'حدث خطأ أثناء الحذف من قاعدة البيانات.' };
  }

  revalidatePath('/system/cms/media');
  return { success: true };
}
