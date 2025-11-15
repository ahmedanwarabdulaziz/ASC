import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// POST - Get statuses and categories for multiple members at once
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

    const body = await request.json();
    const { memberIds } = body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: 'معرفات الأعضاء مطلوبة' }, { status: 400 });
    }

    // Get user role and supervisor_id
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role, supervisor_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // Build status query
    let statusQuery = supabaseAdmin
      .from('member_statuses')
      .select(`
        *,
        updated_by_user:users!member_statuses_updated_by_fkey (
          id,
          email,
          display_name,
          role,
          code
        )
      `)
      .in('member_id', memberIds)
      .order('created_at', { ascending: false });

    // Apply role-based filtering for statuses
    if (userData.role === 'team_leader') {
      statusQuery = statusQuery.eq('updated_by', user.id);
    } else if (userData.role === 'supervisor') {
      const { data: leaders } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'team_leader')
        .eq('supervisor_id', user.id);

      const leaderIds = leaders?.map(l => l.id) || [];
      statusQuery = statusQuery.in('updated_by', [user.id, ...leaderIds]);
    }

    const { data: allStatuses, error: statusError } = await statusQuery;

    if (statusError) {
      console.error('Error fetching statuses:', statusError);
      return NextResponse.json({ error: 'فشل جلب الحالات' }, { status: 500 });
    }

    // Build category query
    let categoryQuery = supabaseAdmin
      .from('member_category_assignments')
      .select(`
        *,
        category:categories (
          id,
          name,
          description
        )
      `)
      .in('member_id', memberIds);

    // Apply role-based filtering for categories
    if (userData.role === 'supervisor') {
      const { data: leaders } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'team_leader')
        .eq('supervisor_id', user.id);

      const leaderIds = leaders?.map(l => l.id) || [];
      categoryQuery = categoryQuery.in('assigned_by', [user.id, ...leaderIds]);
    } else if (userData.role === 'team_leader') {
      categoryQuery = categoryQuery.eq('assigned_by', user.id);
    }

    const { data: allCategories, error: categoryError } = await categoryQuery
      .order('assigned_at', { ascending: false });

    if (categoryError) {
      console.error('Error fetching categories:', categoryError);
      return NextResponse.json({ error: 'فشل جلب التصنيفات' }, { status: 500 });
    }

    // Group statuses by member_id and get latest for each
    const statusesByMember: Record<string, any[]> = {};
    const latestStatusByMember: Record<string, any> = {};

    (allStatuses || []).forEach((status: any) => {
      if (!statusesByMember[status.member_id]) {
        statusesByMember[status.member_id] = [];
      }
      statusesByMember[status.member_id].push(status);
      
      // Track latest status for each member
      if (!latestStatusByMember[status.member_id] || 
          new Date(status.created_at) > new Date(latestStatusByMember[status.member_id].created_at)) {
        latestStatusByMember[status.member_id] = status;
      }
    });

    // Group categories by member_id and get latest for each
    const categoriesByMember: Record<string, any> = {};

    (allCategories || []).forEach((assignment: any) => {
      // Only keep the latest assignment per member
      if (!categoriesByMember[assignment.member_id] || 
          new Date(assignment.assigned_at) > new Date(categoriesByMember[assignment.member_id].assigned_at)) {
        if (assignment.category) {
          assignment.category_name = assignment.category.name;
        }
        categoriesByMember[assignment.member_id] = assignment;
      }
    });

    // Build response
    const result: Record<string, { statuses: any[], latestStatus?: any, category?: any }> = {};
    
    memberIds.forEach((memberId: string) => {
      result[memberId] = {
        statuses: statusesByMember[memberId] || [],
        latestStatus: latestStatusByMember[memberId] || null,
        category: categoriesByMember[memberId] || null,
      };
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}


