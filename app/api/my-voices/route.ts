import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
      .select('role, code, supervisor_id, id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get('q') || '';
    const searchColumn = searchParams.get('column') || 'all';
    const statusFilter = searchParams.get('status') || 'all';
    const categoryFilter = searchParams.get('category') || 'all';
    const userFilter = searchParams.get('user') || 'all'; // Changed from leaderFilter to userFilter

    // Get member IDs based on role
    let memberIds: string[] = [];

    if (userData.role === 'team_leader') {
      // Leaders: Members where they updated status
      const { data: statuses } = await supabaseAdmin
        .from('member_statuses')
        .select('member_id')
        .eq('updated_by', user.id)
        .order('updated_at', { ascending: false });

      memberIds = Array.from(new Set((statuses || []).map(s => s.member_id)));
    } else if (userData.role === 'supervisor') {
      // Supervisors: Members where they or their leaders updated status
      // First get leaders under this supervisor
      const { data: leaders } = await supabaseAdmin
        .from('users')
        .select('id, code')
        .eq('role', 'team_leader')
        .eq('supervisor_id', user.id);

      let allUserIds: string[] = [];
      
      if (userFilter !== 'all') {
        // Parse the user filter (format: "supervisor:CODE" or "leader:CODE")
        const [filterType, filterCode] = userFilter.split(':');
        
        if (filterType === 'supervisor') {
          // Filter by supervisor's own updates (match by user ID, not code)
          allUserIds = [user.id];
        } else if (filterType === 'leader') {
          // Filter by specific leader
          const filteredLeader = leaders?.find(l => l.code === filterCode);
          if (filteredLeader) {
            allUserIds = [filteredLeader.id];
          } else {
            // Leader not found, return empty
            return NextResponse.json({ success: true, members: [] });
          }
        } else {
          // Invalid filter, return empty
          return NextResponse.json({ success: true, members: [] });
        }
      } else {
        // No user filter - include supervisor and all leaders
        const leaderIds = leaders?.map(l => l.id) || [];
        allUserIds = [user.id, ...leaderIds];
      }

      const { data: statuses } = await supabaseAdmin
        .from('member_statuses')
        .select('member_id')
        .in('updated_by', allUserIds)
        .order('updated_at', { ascending: false });

      memberIds = Array.from(new Set((statuses || []).map(s => s.member_id)));
    } else if (userData.role === 'admin') {
      // Admin: All members with status updates
      const { data: statuses } = await supabaseAdmin
        .from('member_statuses')
        .select('member_id')
        .order('updated_at', { ascending: false });

      memberIds = Array.from(new Set((statuses || []).map(s => s.member_id)));
    }

    if (memberIds.length === 0) {
      return NextResponse.json({ success: true, members: [] });
    }

    // Build query for members
    let query = supabaseAdmin
      .from('members')
      .select('*')
      .in('id', memberIds);

    // Apply search filter if provided
    if (searchQuery && searchQuery.trim().length > 0) {
      if (searchColumn !== 'all') {
        switch (searchColumn) {
          case 'name':
            query = query.or(`name.ilike.%${searchQuery}%,name_search.ilike.%${searchQuery}%`);
            break;
          case 'address':
            query = query.or(`address.ilike.%${searchQuery}%,address_search.ilike.%${searchQuery}%`);
            break;
          case 'job':
            query = query.or(`job.ilike.%${searchQuery}%,job_search.ilike.%${searchQuery}%`);
            break;
          case 'mobile':
            query = query.ilike('mobile', `%${searchQuery}%`);
            break;
          case 'phone':
            query = query.ilike('phone', `%${searchQuery}%`);
            break;
          case 'member_id':
            query = query.ilike('member_id', `%${searchQuery}%`);
            break;
        }
      } else {
        // Search all columns
        query = query.or(`name.ilike.%${searchQuery}%,name_search.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,address_search.ilike.%${searchQuery}%,job.ilike.%${searchQuery}%,job_search.ilike.%${searchQuery}%,mobile.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,member_id.ilike.%${searchQuery}%`);
      }
    }

    const { data: members, error: membersError } = await query;

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json({ error: 'فشل جلب الأعضاء' }, { status: 500 });
    }

    if (!members || members.length === 0) {
      return NextResponse.json({ success: true, members: [] });
    }

    // Get latest status for each member
    const { data: allStatuses } = await supabaseAdmin
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
      .in('member_id', members.map(m => m.id))
      .order('updated_at', { ascending: false });

    // Get category assignments for each member
    const { data: categoryAssignments } = await supabaseAdmin
      .from('member_category_assignments')
      .select(`
        *,
        category:categories (
          id,
          name
        )
      `)
      .in('member_id', members.map(m => m.id));

    // Group statuses by member and get latest
    const statusesByMember: Record<string, any> = {};
    (allStatuses || []).forEach((status: any) => {
      if (!statusesByMember[status.member_id] || 
          new Date(status.updated_at) > new Date(statusesByMember[status.member_id].updated_at)) {
        statusesByMember[status.member_id] = {
          ...status,
          updated_by_name: status.updated_by_user?.display_name || status.updated_by_user?.email,
          updated_by_email: status.updated_by_user?.email,
        };
      }
    });

    // Group categories by member
    const categoriesByMember: Record<string, any> = {};
    (categoryAssignments || []).forEach((assignment: any) => {
      categoriesByMember[assignment.member_id] = {
        ...assignment,
        category_name: assignment.category?.name,
      };
    });

    // Combine members with their latest status and category
    const membersWithData = members.map((member: any) => {
      const latestStatus = statusesByMember[member.id];
      const category = categoriesByMember[member.id];

      // Apply status filter
      if (statusFilter !== 'all' && (!latestStatus || latestStatus.status !== statusFilter)) {
        return null;
      }

      // Apply category filter
      if (categoryFilter !== 'all' && (!category || category.category_id !== categoryFilter)) {
        return null;
      }

      return {
        ...member,
        latest_status: latestStatus || null,
        category: category || null,
        updated_by: latestStatus?.updated_by,
        updated_by_name: latestStatus?.updated_by_name,
        updated_by_email: latestStatus?.updated_by_email,
        updated_at: latestStatus?.updated_at,
      };
    }).filter(m => m !== null);

    return NextResponse.json({ 
      success: true, 
      members: membersWithData 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

