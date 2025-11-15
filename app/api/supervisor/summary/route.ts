import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MemberStatus } from '@/types';

// GET - Get status and category summaries for supervisor dashboard
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

    // Get user role and supervisor_id
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role, supervisor_id, id, display_name, code')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // Only supervisors can access this endpoint
    if (userData.role !== 'supervisor') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Get all leaders under this supervisor
    const { data: leaders, error: leadersError } = await supabaseAdmin
      .from('users')
      .select('id, display_name, code, email')
      .eq('role', 'team_leader')
      .eq('supervisor_id', user.id)
      .order('display_name', { ascending: true });

    if (leadersError) {
      console.error('Error fetching leaders:', leadersError);
      return NextResponse.json({ error: 'فشل جلب القادة' }, { status: 500 });
    }

    const leaderIds = leaders?.map(l => l.id) || [];
    const allUserIds = [user.id, ...leaderIds];

    // Get all unique member IDs that have statuses or categories from supervisor or leaders
    const { data: statusMembers } = await supabaseAdmin
      .from('member_statuses')
      .select('member_id')
      .in('updated_by', allUserIds);

    const { data: categoryMembers } = await supabaseAdmin
      .from('member_category_assignments')
      .select('member_id')
      .in('assigned_by', allUserIds);

    const allMemberIds = new Set([
      ...(statusMembers?.map(s => s.member_id) || []),
      ...(categoryMembers?.map(c => c.member_id) || [])
    ]);

    if (allMemberIds.size === 0) {
      // Return empty structure
      return NextResponse.json({
        totals: { statuses: {}, categories: {} },
        supervisor: { statuses: {}, categories: {}, user: userData },
        leadersTotal: { statuses: {}, categories: {} },
        leaders: []
      });
    }

    // Get latest status for each member (grouped by updated_by)
    const { data: allStatuses } = await supabaseAdmin
      .from('member_statuses')
      .select('member_id, status, updated_by, created_at')
      .in('member_id', Array.from(allMemberIds))
      .in('updated_by', allUserIds)
      .order('created_at', { ascending: false });

    // Get latest category assignment for each member (grouped by assigned_by)
    const { data: allCategories } = await supabaseAdmin
      .from('member_category_assignments')
      .select(`
        member_id,
        assigned_by,
        assigned_at,
        category:categories (
          id,
          name
        )
      `)
      .in('member_id', Array.from(allMemberIds))
      .in('assigned_by', allUserIds)
      .order('assigned_at', { ascending: false });

    // Helper function to count statuses
    const countStatuses = (statuses: any[], userIds: string[]) => {
      const filtered = statuses.filter(s => userIds.includes(s.updated_by));
      // Get latest status per member
      const latestByMember: Record<string, any> = {};
      filtered.forEach(s => {
        if (!latestByMember[s.member_id] || 
            new Date(s.created_at) > new Date(latestByMember[s.member_id].created_at)) {
          latestByMember[s.member_id] = s;
        }
      });

      const counts: Record<MemberStatus, number> = {
        chance: 0,
        called: 0,
        will_vote: 0,
        sure_vote: 0,
        voted: 0
      };

      Object.values(latestByMember).forEach((s: any) => {
        if (s.status && s.status in counts) {
          counts[s.status as MemberStatus]++;
        }
      });

      return counts;
    };

    // Helper function to count categories
    const countCategories = (categories: any[], userIds: string[]) => {
      const filtered = categories.filter(c => userIds.includes(c.assigned_by));
      // Get latest category per member
      const latestByMember: Record<string, any> = {};
      filtered.forEach(c => {
        if (!latestByMember[c.member_id] || 
            new Date(c.assigned_at) > new Date(latestByMember[c.member_id].assigned_at)) {
          latestByMember[c.member_id] = c;
        }
      });

      const categoryCounts: Record<string, number> = {};
      Object.values(latestByMember).forEach((c: any) => {
        const categoryName = c.category?.name || 'غير محدد';
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
      });

      return categoryCounts;
    };

    // Calculate totals (supervisor + all leaders)
    const totalsStatuses = countStatuses(allStatuses || [], allUserIds);
    const totalsCategories = countCategories(allCategories || [], allUserIds);

    // Calculate supervisor alone
    const supervisorStatuses = countStatuses(allStatuses || [], [user.id]);
    const supervisorCategories = countCategories(allCategories || [], [user.id]);

    // Calculate leaders total
    const leadersTotalStatuses = countStatuses(allStatuses || [], leaderIds);
    const leadersTotalCategories = countCategories(allCategories || [], leaderIds);

    // Calculate each leader individually
    const leadersData = (leaders || []).map(leader => ({
      user: leader,
      statuses: countStatuses(allStatuses || [], [leader.id]),
      categories: countCategories(allCategories || [], [leader.id])
    }));

    return NextResponse.json({
      totals: {
        statuses: totalsStatuses,
        categories: totalsCategories
      },
      supervisor: {
        statuses: supervisorStatuses,
        categories: supervisorCategories,
        user: userData
      },
      leadersTotal: {
        statuses: leadersTotalStatuses,
        categories: leadersTotalCategories
      },
      leaders: leadersData
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

