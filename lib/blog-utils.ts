import { supabase } from './supabase';

/**
 * Upload image to Supabase Storage via API route
 */
export async function uploadBlogImage(
  file: File,
  folder: 'featured' | 'thumbnails' | 'content' = 'content'
): Promise<string> {
  try {
    // Use API route for upload (uses admin client)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await fetch('/api/blog/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'فشل رفع الصورة');
    }

    const data = await response.json();
    return data.url;
  } catch (error: any) {
    throw new Error(`فشل رفع الصورة: ${error.message}`);
  }
}

/**
 * Delete image from Supabase Storage
 */
export async function deleteBlogImage(imageUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === 'blog-images');
    
    if (bucketIndex === -1) {
      throw new Error('رابط الصورة غير صحيح');
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from('blog-images')
      .remove([filePath]);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting image:', error);
    // Don't throw - allow deletion to continue even if image deletion fails
  }
}

/**
 * Save post images to database
 */
export async function savePostImages(
  postId: string,
  images: Array<{ image_url: string; alt_text?: string; order_index: number }>
): Promise<void> {
  try {
    if (images.length === 0) return;

    // Use admin client to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = 'https://xkbiqoajqxlvxjcwvhzv.supabase.co';
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYmlxb2FqcXhsdnhqY3d2aHp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE5NTEzOSwiZXhwIjoyMDc4NzcxMTM5fQ.q-Q41xN8vhc2_sA8q2tVqKvoKLNWOv8o065DPgUBb3k';
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { error } = await adminClient
      .from('blog_post_images')
      .insert(
        images.map(img => ({
          post_id: postId,
          image_url: img.image_url,
          alt_text: img.alt_text || '',
          order_index: img.order_index,
        }))
      );

    if (error) {
      console.error('Error saving post images:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('Exception in savePostImages:', error);
    throw new Error(`فشل حفظ الصور: ${error.message}`);
  }
}

/**
 * Delete all images for a post
 */
export async function deletePostImages(postId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('blog_post_images')
      .delete()
      .eq('post_id', postId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting post images:', error);
  }
}

