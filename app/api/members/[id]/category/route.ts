import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// POST - Assign a member to a category
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { categoryId } = body;

    if (!categoryId) {
      return NextResponse.json({ error: 'معرف الفئة مطلوب' }, { status: 400 });
    }

    const memberId = params.id;

    // Verify category belongs to user
    const { data: category } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('id', categoryId)
      .eq('created_by', user.id)
      .single();

    if (!category) {
      return NextResponse.json({ error: 'الفئة غير موجودة أو غير مصرح بها' }, { status: 404 });
    }

    // Check if member already has a category assignment from this user
    const { data: existingAssignment } = await supabaseAdmin
      .from('member_category_assignments')
      .select('id')
      .eq('member_id', memberId)
      .eq('assigned_by', user.id)
      .single();

    if (existingAssignment) {
      // Update existing assignment
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('member_category_assignments')
        .update({ category_id: categoryId })
        .eq('id', existingAssignment.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating category assignment:', updateError);
        return NextResponse.json({ error: 'فشل تحديث التصنيف' }, { status: 500 });
      }

      return NextResponse.json({ assignment: updated, message: 'تم تحديث التصنيف بنجاح' });
    } else {
      // Create new assignment
      const { data: newAssignment, error: insertError } = await supabaseAdmin
        .from('member_category_assignments')
        .insert({
          member_id: memberId,
          category_id: categoryId,
          assigned_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating category assignment:', insertError);
        return NextResponse.json({ error: 'فشل تعيين التصنيف' }, { status: 500 });
      }

      // Fetch the category name
      const { data: categoryData } = await supabaseAdmin
        .from('categories')
        .select('name')
        .eq('id', categoryId)
        .single();

      // Add category_name to assignment for easier access
      if (newAssignment && categoryData) {
        newAssignment.category_name = categoryData.name;
      }

      return NextResponse.json({ assignment: newAssignment, message: 'تم تعيين التصنيف بنجاح' });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// DELETE - Remove member from category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const memberId = params.id;

    // Delete assignment
    const { error: deleteError } = await supabaseAdmin
      .from('member_category_assignments')
      .delete()
      .eq('member_id', memberId)
      .eq('assigned_by', user.id);

    if (deleteError) {
      console.error('Error deleting category assignment:', deleteError);
      return NextResponse.json({ error: 'فشل حذف التصنيف' }, { status: 500 });
    }

    return NextResponse.json({ message: 'تم حذف التصنيف بنجاح' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// GET - Get category assignment for a member
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const memberId = params.id;

    // Get user role and supervisor_id
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role, supervisor_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    let assignmentQuery = supabaseAdmin
      .from('member_category_assignments')
      .select(`
        *,
        category:categories (
          id,
          name,
          description
        )
      `)
      .eq('member_id', memberId);

    // For supervisors, show categories assigned by themselves OR by their leaders
    if (userData.role === 'supervisor') {
      // Get all leaders under this supervisor
      const { data: leaders } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'team_leader')
        .eq('supervisor_id', user.id);

      const leaderIds = leaders ? leaders.map(l => l.id) : [];
      // Include supervisor's own ID and all leader IDs
      const allUserIds = [user.id, ...leaderIds];
      assignmentQuery = assignmentQuery.in('assigned_by', allUserIds);
    } else if (userData.role === 'team_leader') {
      // For team leaders, only show their own categories
      assignmentQuery = assignmentQuery.eq('assigned_by', user.id);
    } else if (userData.role === 'admin') {
      // For admins, show all categories for this member
      // No filter needed - show all
    } else {
      // For other roles, only show their own
      assignmentQuery = assignmentQuery.eq('assigned_by', user.id);
    }

    // Get the most recent assignment (if multiple exist, take the latest)
    const { data: assignments, error } = await assignmentQuery
      .order('assigned_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching category assignment:', error);
      return NextResponse.json({ error: 'فشل جلب التصنيف' }, { status: 500 });
    }

    const assignment = assignments && assignments.length > 0 ? assignments[0] : null;

    // Add category_name to assignment for easier access
    if (assignment && assignment.category) {
      assignment.category_name = assignment.category.name;
    }

    return NextResponse.json({ assignment: assignment || null });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

