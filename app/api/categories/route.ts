import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET - Get all categories for the current user
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xkbiqoajqxlvxjcwvhzv.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYmlxb2FqcXhsdnhqY3d2aHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTUxMzksImV4cCI6MjA3ODc3MTEzOX0.-3yBJSlAv_iFkq1tAdHhp7linLuIajS_e95UZzdcheA',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Get user role and codes
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role, code, supervisor_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // Only supervisors and leaders can have categories
    if (userData.role !== 'supervisor' && userData.role !== 'team_leader') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Get user's categories with member counts
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select(`
        *,
        assignments:member_category_assignments(count)
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return NextResponse.json({ error: 'فشل جلب الفئات' }, { status: 500 });
    }

    // Format categories with member counts
    const formattedCategories = (categories || []).map(cat => ({
      ...cat,
      member_count: Array.isArray(cat.assignments) ? cat.assignments.length : 0,
    }));

    return NextResponse.json({ categories: formattedCategories });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// POST - Create a new category
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xkbiqoajqxlvxjcwvhzv.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYmlxb2FqcXhsdnhqY3d2aHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTUxMzksImV4cCI6MjA3ODc3MTEzOX0.-3yBJSlAv_iFkq1tAdHhp7linLuIajS_e95UZzdcheA',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Get user role and codes
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role, code')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // Only supervisors and leaders can create categories
    if (userData.role !== 'supervisor' && userData.role !== 'team_leader') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'اسم الفئة مطلوب' }, { status: 400 });
    }

    // Check if category with same name already exists for this user
    const { data: existing } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('created_by', user.id)
      .eq('name', name.trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'فئة بهذا الاسم موجودة بالفعل' }, { status: 400 });
    }

    // Prepare category data
    const categoryData: any = {
      name: name.trim(),
      description: description?.trim() || null,
      created_by: user.id,
    };

    // Add codes based on role
    if (userData.role === 'supervisor') {
      categoryData.supervisor_code = userData.code;
    } else if (userData.role === 'team_leader') {
      categoryData.leader_code = userData.code;
    }

    // Insert category
    const { data: newCategory, error: insertError } = await supabaseAdmin
      .from('categories')
      .insert(categoryData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating category:', insertError);
      return NextResponse.json({ error: 'فشل إنشاء الفئة' }, { status: 500 });
    }

    return NextResponse.json({ category: newCategory, message: 'تم إنشاء الفئة بنجاح' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// PUT - Update a category
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xkbiqoajqxlvxjcwvhzv.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYmlxb2FqcXhsdnhqY3d2aHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTUxMzksImV4cCI6MjA3ODc3MTEzOX0.-3yBJSlAv_iFkq1tAdHhp7linLuIajS_e95UZzdcheA',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, name, description } = body;

    if (!categoryId) {
      return NextResponse.json({ error: 'معرف الفئة مطلوب' }, { status: 400 });
    }

    // Check if user owns this category
    const { data: existingCategory } = await supabaseAdmin
      .from('categories')
      .select('created_by')
      .eq('id', categoryId)
      .single();

    if (!existingCategory) {
      return NextResponse.json({ error: 'الفئة غير موجودة' }, { status: 404 });
    }

    if (existingCategory.created_by !== user.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Update category
    const updateData: any = {};
    if (name) {
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    const { data: updatedCategory, error: updateError } = await supabaseAdmin
      .from('categories')
      .update(updateData)
      .eq('id', categoryId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating category:', updateError);
      return NextResponse.json({ error: 'فشل تحديث الفئة' }, { status: 500 });
    }

    return NextResponse.json({ category: updatedCategory, message: 'تم تحديث الفئة بنجاح' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// DELETE - Delete a category
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xkbiqoajqxlvxjcwvhzv.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYmlxb2FqcXhsdnhqY3d2aHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTUxMzksImV4cCI6MjA3ODc3MTEzOX0.-3yBJSlAv_iFkq1tAdHhp7linLuIajS_e95UZzdcheA',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json({ error: 'معرف الفئة مطلوب' }, { status: 400 });
    }

    // Check if user owns this category
    const { data: existingCategory } = await supabaseAdmin
      .from('categories')
      .select('created_by')
      .eq('id', categoryId)
      .single();

    if (!existingCategory) {
      return NextResponse.json({ error: 'الفئة غير موجودة' }, { status: 404 });
    }

    if (existingCategory.created_by !== user.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Delete category (assignments will be cascade deleted)
    const { error: deleteError } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (deleteError) {
      console.error('Error deleting category:', deleteError);
      return NextResponse.json({ error: 'فشل حذف الفئة' }, { status: 500 });
    }

    return NextResponse.json({ message: 'تم حذف الفئة بنجاح' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}


