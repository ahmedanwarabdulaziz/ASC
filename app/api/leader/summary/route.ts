import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MemberStatus } from '@/types';

// GET - Get status and category summaries for leader dashboard
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

    // Only team leaders can access this endpoint
    if (userData.role !== 'team_leader') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Get all unique member IDs that have statuses or categories from this leader
    const { data: statusMembers } = await supabaseAdmin
      .from('member_statuses')
      .select('member_id')
      .eq('updated_by', user.id);

    const { data: categoryMembers } = await supabaseAdmin
      .from('member_category_assignments')
      .select('member_id')
      .eq('assigned_by', user.id);

    const allMemberIds = new Set([
      ...(statusMembers?.map(s => s.member_id) || []),
      ...(categoryMembers?.map(c => c.member_id) || [])
    ]);

    if (allMemberIds.size === 0) {
      // Return empty structure
      return NextResponse.json({
        statuses: {},
        categories: {},
        user: userData
      });
    }

    // Get latest status for each member
    const { data: allStatuses } = await supabaseAdmin
      .from('member_statuses')
      .select('member_id, status, updated_by, created_at')
      .in('member_id', Array.from(allMemberIds))
      .eq('updated_by', user.id)
      .order('created_at', { ascending: false });

    // Get latest category assignment for each member
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
      .eq('assigned_by', user.id)
      .order('assigned_at', { ascending: false });

    // Helper function to count statuses
    const countStatuses = (statuses: any[]) => {
      // Get latest status per member
      const latestByMember: Record<string, any> = {};
      (statuses || []).forEach(s => {
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
    const countCategories = (categories: any[]) => {
      // Get latest category per member
      const latestByMember: Record<string, any> = {};
      (categories || []).forEach(c => {
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

    // Calculate leader's statuses and categories
    const leaderStatuses = countStatuses(allStatuses || []);
    const leaderCategories = countCategories(allCategories || []);

    return NextResponse.json({
      statuses: leaderStatuses,
      categories: leaderCategories,
      user: userData
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

