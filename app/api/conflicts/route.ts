import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET - Get all conflicts (admin only)
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

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح - فقط المدير' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const resolved = searchParams.get('resolved');

    // Build query
    let query = supabaseAdmin
      .from('status_conflicts')
      .select(`
        *,
        member:members!status_conflicts_member_id_fkey (
          id,
          name,
          member_id
        )
      `)
      .order('created_at', { ascending: false });

    if (resolved === 'true') {
      query = query.eq('resolved', true);
    } else if (resolved === 'false') {
      query = query.eq('resolved', false);
    }

    const { data: conflicts, error } = await query;

    if (error) {
      console.error('Error fetching conflicts:', error);
      return NextResponse.json({ error: 'فشل جلب التعارضات' }, { status: 500 });
    }

    // Get status details for each conflict
    const conflictsWithStatuses = await Promise.all(
      (conflicts || []).map(async (conflict) => {
        const { data: statuses } = await supabaseAdmin
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
          .in('id', conflict.status_ids);

        return {
          ...conflict,
          statuses: statuses || [],
        };
      })
    );

    return NextResponse.json({ conflicts: conflictsWithStatuses });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// PUT - Resolve a conflict (admin only)
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

    // Get user role
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح - فقط المدير' }, { status: 403 });
    }

    const body = await request.json();
    const { conflictId, resolutionNotes, keepStatusIds } = body;

    if (!conflictId) {
      return NextResponse.json({ error: 'معرف التعارض مطلوب' }, { status: 400 });
    }

    // Get conflict
    const { data: conflict } = await supabaseAdmin
      .from('status_conflicts')
      .select('status_ids')
      .eq('id', conflictId)
      .single();

    if (!conflict) {
      return NextResponse.json({ error: 'التعارض غير موجود' }, { status: 404 });
    }

    // If keepStatusIds provided, delete other statuses
    if (keepStatusIds && Array.isArray(keepStatusIds)) {
      const statusIdsToDelete = conflict.status_ids.filter((id: string) => !keepStatusIds.includes(id));
      
      if (statusIdsToDelete.length > 0) {
        await supabaseAdmin
          .from('member_statuses')
          .delete()
          .in('id', statusIdsToDelete);
      }
    }

    // Mark conflict as resolved
    const { data: resolvedConflict, error: updateError } = await supabaseAdmin
      .from('status_conflicts')
      .update({
        resolved: true,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionNotes || null,
      })
      .eq('id', conflictId)
      .select()
      .single();

    if (updateError) {
      console.error('Error resolving conflict:', updateError);
      return NextResponse.json({ error: 'فشل حل التعارض' }, { status: 500 });
    }

    return NextResponse.json({ conflict: resolvedConflict, message: 'تم حل التعارض بنجاح' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}


