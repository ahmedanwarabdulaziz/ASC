import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MemberStatus } from '@/types';

// GET - Get all statuses for a member
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

    // Get user role and codes
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role, code, supervisor_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const memberId = params.id;

    // Build query based on role
    let query = supabaseAdmin
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
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    // Apply role-based filtering
    if (userData.role === 'team_leader') {
      // Leaders can only see their own statuses
      query = query.eq('updated_by', user.id);
    } else if (userData.role === 'supervisor') {
      // Supervisors can see their own and their leaders' statuses
      const { data: leaders } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'team_leader')
        .eq('supervisor_id', user.id);

      const leaderIds = leaders?.map(l => l.id) || [];
      query = query.in('updated_by', [user.id, ...leaderIds]);
    }
    // Admin can see all (no filter needed)

    const { data: statuses, error } = await query;

    if (error) {
      console.error('Error fetching statuses:', error);
      return NextResponse.json({ error: 'فشل جلب الحالات' }, { status: 500 });
    }

    return NextResponse.json({ statuses: statuses || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// POST - Create a new status for a member
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

    // Get user role and codes
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role, code, supervisor_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // Only supervisors and leaders can create statuses
    if (userData.role !== 'supervisor' && userData.role !== 'team_leader') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { status, notes } = body;

    if (!status || !['chance', 'called', 'will_vote', 'sure_vote', 'voted'].includes(status)) {
      return NextResponse.json({ error: 'حالة غير صحيحة' }, { status: 400 });
    }

    const memberId = params.id;

    // Prepare status data
    const statusData: any = {
      member_id: memberId,
      status: status as MemberStatus,
      updated_by: user.id,
      notes: notes || null,
    };

    // Add codes based on role
    if (userData.role === 'supervisor') {
      statusData.supervisor_code = userData.code;
    } else if (userData.role === 'team_leader') {
      statusData.leader_code = userData.code;
    }

    // Check if there's an existing status from this user for this member
    const { data: existingStatus } = await supabaseAdmin
      .from('member_statuses')
      .select('id')
      .eq('member_id', memberId)
      .eq('updated_by', user.id)
      .maybeSingle();

    let newStatus;
    let error;

    if (existingStatus) {
      // Update existing status instead of creating a new one
      const { data: updatedStatus, error: updateError } = await supabaseAdmin
        .from('member_statuses')
        .update({
          status: statusData.status,
          notes: statusData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingStatus.id)
        .select()
        .single();

      newStatus = updatedStatus;
      error = updateError;
    } else {
      // Insert new status if none exists
      const { data: insertedStatus, error: insertError } = await supabaseAdmin
        .from('member_statuses')
        .insert(statusData)
        .select()
        .single();

      newStatus = insertedStatus;
      error = insertError;
    }

    if (error) {
      console.error('Error saving status:', error);
      return NextResponse.json({ error: 'فشل حفظ الحالة' }, { status: 500 });
    }

    return NextResponse.json({ status: newStatus, message: 'تم حفظ الحالة بنجاح' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// PUT - Update a status (only leaders can update their own)
export async function PUT(
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
    const { statusId, status, notes } = body;

    if (!statusId) {
      return NextResponse.json({ error: 'معرف الحالة مطلوب' }, { status: 400 });
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

    // Check if user can update this status
    const { data: existingStatus } = await supabaseAdmin
      .from('member_statuses')
      .select('updated_by')
      .eq('id', statusId)
      .single();

    if (!existingStatus) {
      return NextResponse.json({ error: 'الحالة غير موجودة' }, { status: 404 });
    }

    // Only leaders can update their own statuses, or admins can update any
    if (userData.role === 'team_leader' && existingStatus.updated_by !== user.id) {
      return NextResponse.json({ error: 'غير مصرح بتعديل هذه الحالة' }, { status: 403 });
    }

    if (userData.role !== 'admin' && userData.role !== 'team_leader') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Update status
    const updateData: any = {};
    if (status) {
      if (!['chance', 'called', 'will_vote', 'sure_vote', 'voted'].includes(status)) {
        return NextResponse.json({ error: 'حالة غير صحيحة' }, { status: 400 });
      }
      updateData.status = status;
    }
    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    const { data: updatedStatus, error: updateError } = await supabaseAdmin
      .from('member_statuses')
      .update(updateData)
      .eq('id', statusId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating status:', updateError);
      return NextResponse.json({ error: 'فشل تحديث الحالة' }, { status: 500 });
    }

    return NextResponse.json({ status: updatedStatus, message: 'تم تحديث الحالة بنجاح' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// DELETE - Delete a status (only admins or leaders deleting their own)
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

    const { searchParams } = new URL(request.url);
    const statusId = searchParams.get('statusId');

    if (!statusId) {
      return NextResponse.json({ error: 'معرف الحالة مطلوب' }, { status: 400 });
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

    // Check if user can delete this status
    const { data: existingStatus } = await supabaseAdmin
      .from('member_statuses')
      .select('updated_by')
      .eq('id', statusId)
      .single();

    if (!existingStatus) {
      return NextResponse.json({ error: 'الحالة غير موجودة' }, { status: 404 });
    }

    // Only admins can delete any status, or leaders can delete their own
    if (userData.role !== 'admin' && (userData.role !== 'team_leader' || existingStatus.updated_by !== user.id)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Delete status
    const { error: deleteError } = await supabaseAdmin
      .from('member_statuses')
      .delete()
      .eq('id', statusId);

    if (deleteError) {
      console.error('Error deleting status:', deleteError);
      return NextResponse.json({ error: 'فشل حذف الحالة' }, { status: 500 });
    }

    return NextResponse.json({ message: 'تم حذف الحالة بنجاح' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

