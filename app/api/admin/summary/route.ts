import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MemberStatus } from '@/types';

// GET - Get status and category summaries for admin dashboard
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

    // Get user role
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // Only admins can access this endpoint
    if (userData.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Get all supervisors
    const { data: supervisors, error: supervisorsError } = await supabaseAdmin
      .from('users')
      .select('id, display_name, code, email')
      .eq('role', 'supervisor')
      .order('display_name', { ascending: true });

    if (supervisorsError) {
      console.error('Error fetching supervisors:', supervisorsError);
      return NextResponse.json({ error: 'فشل جلب المشرفين' }, { status: 500 });
    }

    // Get all leaders
    const { data: allLeaders, error: leadersError } = await supabaseAdmin
      .from('users')
      .select('id, display_name, code, email, supervisor_id')
      .eq('role', 'team_leader')
      .order('display_name', { ascending: true });

    if (leadersError) {
      console.error('Error fetching leaders:', leadersError);
      return NextResponse.json({ error: 'فشل جلب القادة' }, { status: 500 });
    }

    // Group leaders by supervisor
    const leadersBySupervisor: Record<string, any[]> = {};
    (allLeaders || []).forEach(leader => {
      if (leader.supervisor_id) {
        if (!leadersBySupervisor[leader.supervisor_id]) {
          leadersBySupervisor[leader.supervisor_id] = [];
        }
        leadersBySupervisor[leader.supervisor_id].push(leader);
      }
    });

    // Get all user IDs (supervisors + leaders)
    const allUserIds = [
      ...(supervisors?.map(s => s.id) || []),
      ...(allLeaders?.map(l => l.id) || [])
    ];

    if (allUserIds.length === 0) {
      return NextResponse.json({
        totals: { statuses: {}, categories: {} },
        supervisors: []
      });
    }

    // Get all unique member IDs that have statuses or categories from the team
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
      return NextResponse.json({
        totals: { statuses: {}, categories: {} },
        supervisors: (supervisors || []).map(supervisor => {
          const supervisorLeaders = leadersBySupervisor[supervisor.id] || [];
          return {
            user: {
              id: supervisor.id,
              display_name: supervisor.display_name || null,
              code: supervisor.code || null,
              email: supervisor.email || null
            },
            statuses: {},
            categories: {},
            leadersTotal: { statuses: {}, categories: {} },
            leaders: supervisorLeaders.map(leader => ({
              user: {
                id: leader.id,
                display_name: leader.display_name || null,
                code: leader.code || null,
                email: leader.email || null
              },
              statuses: {},
              categories: {}
            }))
          };
        })
      });
    }

    // Get all statuses for these members (from any user, we'll filter by team later)
    const { data: allStatuses } = await supabaseAdmin
      .from('member_statuses')
      .select('member_id, status, updated_by, created_at')
      .in('member_id', Array.from(allMemberIds))
      .order('created_at', { ascending: false });

    // Get all categories for these members (from any user, we'll filter by team later)
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
      .order('assigned_at', { ascending: false });

    // Helper function to count statuses - gets latest status per member from the team
    const countStatuses = (statuses: any[], userIds: string[]) => {
      // Filter to only statuses updated by users in the team
      const filtered = statuses.filter(s => userIds.includes(s.updated_by));
      
      // Get the absolute latest status per member (not per user)
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
        if (s.status && counts[s.status as MemberStatus] !== undefined) {
          counts[s.status as MemberStatus]++;
        }
      });

      return counts;
    };

    // Helper function to count categories - gets latest category per member from the team
    const countCategories = (categories: any[], userIds: string[]) => {
      // Filter to only categories assigned by users in the team
      const filtered = categories.filter(c => userIds.includes(c.assigned_by));
      
      // Get the absolute latest category per member (not per user)
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

    // Calculate totals (all supervisors + all leaders)
    const totalsStatuses = countStatuses(allStatuses || [], allUserIds);
    const totalsCategories = countCategories(allCategories || [], allUserIds);

    // Calculate for each supervisor
    const supervisorsData = (supervisors || []).map(supervisor => {
      const supervisorLeaders = leadersBySupervisor[supervisor.id] || [];
      const supervisorLeaderIds = supervisorLeaders.map(l => l.id);
      const supervisorAllIds = [supervisor.id, ...supervisorLeaderIds];

      // Supervisor alone
      const supervisorStatuses = countStatuses(allStatuses || [], [supervisor.id]);
      const supervisorCategories = countCategories(allCategories || [], [supervisor.id]);

      // Leaders total for this supervisor
      const leadersTotalStatuses = countStatuses(allStatuses || [], supervisorLeaderIds);
      const leadersTotalCategories = countCategories(allCategories || [], supervisorLeaderIds);

      // Each leader individually - ensure user object has all fields
      const leadersData = supervisorLeaders.map(leader => ({
        user: {
          id: leader.id,
          display_name: leader.display_name || null,
          code: leader.code || null,
          email: leader.email || null
        },
        statuses: countStatuses(allStatuses || [], [leader.id]),
        categories: countCategories(allCategories || [], [leader.id])
      }));

      return {
        user: {
          id: supervisor.id,
          display_name: supervisor.display_name || null,
          code: supervisor.code || null,
          email: supervisor.email || null
        },
        statuses: supervisorStatuses,
        categories: supervisorCategories,
        leadersTotal: {
          statuses: leadersTotalStatuses,
          categories: leadersTotalCategories
        },
        leaders: leadersData
      };
    });

    return NextResponse.json({
      totals: {
        statuses: totalsStatuses,
        categories: totalsCategories
      },
      supervisors: supervisorsData
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

