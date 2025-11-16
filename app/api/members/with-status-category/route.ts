export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET /api/members/with-status-category?limit=50
// Optionally supports q and column like the existing members search (basic contains for now)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const q = searchParams.get('q')?.trim() || '';
    const column = (searchParams.get('column') || 'all') as 'all' | 'name' | 'address' | 'job' | 'mobile' | 'phone' | 'member_id';
    const limit = Math.min(Math.max(parseInt(limitParam || '50', 10) || 50, 1), 1000);

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

    // Load base members list (initial load or simple contains search)
    let membersQuery = supabaseAdmin
      .from('members')
      .select(`
        id,
        member_id,
        name,
        name_search,
        address,
        address_search,
        job,
        job_search,
        phone,
        mobile,
        email,
        status,
        notes,
        team_id,
        team_name,
        created_at,
        updated_at
      `)
      .limit(limit);

    if (q) {
      const pattern = `%${q}%`;
      if (column === 'all') {
        membersQuery = membersQuery.or([
          `name_search.ilike.${pattern}`,
          `address_search.ilike.${pattern}`,
          `job_search.ilike.${pattern}`,
          `mobile.ilike.${pattern}`,
          `phone.ilike.${pattern}`,
          `member_id.ilike.${pattern}`,
        ].join(','));
      } else if (column === 'name') {
        membersQuery = membersQuery.ilike('name_search', pattern);
      } else if (column === 'address') {
        membersQuery = membersQuery.ilike('address_search', pattern);
      } else if (column === 'job') {
        membersQuery = membersQuery.ilike('job_search', pattern);
      } else {
        membersQuery = membersQuery.ilike(column, pattern);
      }
    }

    const { data: baseMembers, error: membersError } = await membersQuery;
    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json({ error: 'فشل جلب الأعضاء' }, { status: 500 });
    }

    const memberIds = (baseMembers || []).map(m => m.id);
    if (memberIds.length === 0) {
      return NextResponse.json({ members: [], data: {} });
    }

    // Fetch role to filter statuses and categories accordingly
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
      .select('*')
      .in('member_id', memberIds);

    // Build category assignment query
    let categoryAssignQuery = supabaseAdmin
      .from('member_category_assignments')
      .select(`
        id,
        member_id,
        category_id,
        assigned_by,
        assigned_at
      `)
      .in('member_id', memberIds);

    if (userData.role === 'team_leader') {
      statusQuery = statusQuery.eq('updated_by', user.id);
      categoryAssignQuery = categoryAssignQuery.eq('assigned_by', user.id);
    } else if (userData.role === 'supervisor') {
      // Include supervisor and their leaders
      const { data: leaders } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'team_leader')
        .eq('supervisor_id', user.id);
      const leaderIds = (leaders || []).map(l => l.id);
      statusQuery = statusQuery.in('updated_by', [user.id, ...leaderIds]);
      categoryAssignQuery = categoryAssignQuery.in('assigned_by', [user.id, ...leaderIds]);
    } else if (userData.role === 'admin') {
      // Admin sees all
    } else {
      // Other roles: return empty data
      return NextResponse.json({ members: baseMembers, data: {} });
    }

    const [{ data: statuses }, { data: assignments }] = await Promise.all([
      statusQuery,
      categoryAssignQuery,
    ]);

    // Prepare latest status per member
    const memberIdToStatuses: Record<string, any[]> = {};
    const memberIdToLatestStatus: Record<string, any | null> = {};
    (statuses || []).forEach((s) => {
      if (!memberIdToStatuses[s.member_id]) memberIdToStatuses[s.member_id] = [];
      memberIdToStatuses[s.member_id].push(s);
    });
    Object.keys(memberIdToStatuses).forEach((mid) => {
      memberIdToStatuses[mid].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      memberIdToLatestStatus[mid] = memberIdToStatuses[mid][0] || null;
    });

    // Latest category assignment per member with preference to current user's assignment
    const assignmentsByMember: Record<string, Array<{ id: string; member_id: string; category_id: string; assigned_by: string; assigned_at: string }>> = {};
    (assignments || []).forEach((a) => {
      if (!assignmentsByMember[a.member_id]) assignmentsByMember[a.member_id] = [];
      assignmentsByMember[a.member_id].push(a);
    });
    const memberIdToAssignment = new Map<string, { id: string; member_id: string; category_id: string; assigned_by: string; assigned_at: string }>();
    Object.keys(assignmentsByMember).forEach((mid) => {
      const list = assignmentsByMember[mid];
      const own = list.find(x => x.assigned_by === user.id);
      if (own) {
        memberIdToAssignment.set(mid, own);
      } else {
        const latest = list.sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime())[0];
        if (latest) memberIdToAssignment.set(mid, latest);
      }
    });

    // Resolve category names for assignments
    const categoryIds = Array.from(new Set(Array.from(memberIdToAssignment.values()).map(v => v.category_id)));
    let categoryIdToName: Record<string, string> = {};
    if (categoryIds.length > 0) {
      const { data: cats } = await supabaseAdmin
        .from('categories')
        .select('id,name')
        .in('id', categoryIds);
      (cats || []).forEach((c) => { categoryIdToName[c.id] = c.name; });
    }

    // Build combined data map
    const data: Record<string, any> = {};
    memberIds.forEach((mid) => {
      const assignment = memberIdToAssignment.get(mid);
      data[mid] = {
        statuses: memberIdToStatuses[mid] || [],
        latestStatus: memberIdToLatestStatus[mid] || null,
        category: assignment
          ? {
              id: assignment.id,
              member_id: assignment.member_id,
              category_id: assignment.category_id,
              category_name: categoryIdToName[assignment.category_id] || undefined,
              assigned_by: assignment.assigned_by,
              assigned_at: assignment.assigned_at,
            }
          : null,
      };
    });

    return NextResponse.json({ members: baseMembers, data });
  } catch (error) {
    console.error('with-status-category error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}


