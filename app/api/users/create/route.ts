import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Get current user from session
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

    // Check user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.role !== 'admin' && userData.role !== 'supervisor')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role, displayName, code, supervisorId } = body;

    // Check permissions
    if (userData.role === 'supervisor' && role !== 'team_leader') {
      return NextResponse.json({ error: 'المشرفون يمكنهم إنشاء قادة الفرق فقط' }, { status: 403 });
    }

    // Validate supervisor for team_leader
    if (role === 'team_leader' && !supervisorId) {
      return NextResponse.json({ error: 'يجب اختيار المشرف المسؤول عن قائد الفريق' }, { status: 400 });
    }

    // Auto-generate code for supervisor and team_leader
    let generatedCode: string | null = null;
    if (role === 'supervisor' || role === 'team_leader') {
      // Get the latest code for this role
      const { data: latestUser } = await supabaseAdmin
        .from('users')
        .select('code')
        .eq('role', role)
        .not('code', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Generate new code
      const prefix = role === 'supervisor' ? 'SUP' : 'LEAD';
      let nextNumber = 1;

      if (latestUser?.code) {
        // Extract number from existing code (e.g., SUP001 -> 1)
        const match = latestUser.code.match(/\d+$/);
        if (match) {
          nextNumber = parseInt(match[0], 10) + 1;
        }
      }

      // Format as SUP001, SUP002, etc. or LEAD001, LEAD002, etc.
      generatedCode = `${prefix}${String(nextNumber).padStart(3, '0')}`;
    }

    // Verify supervisor exists if provided
    if (supervisorId) {
      const { data: supervisorData, error: supervisorError } = await supabaseAdmin
        .from('users')
        .select('id, role')
        .eq('id', supervisorId)
        .single();

      if (supervisorError || !supervisorData || supervisorData.role !== 'supervisor') {
        return NextResponse.json({ error: 'المشرف المحدد غير موجود أو غير صحيح' }, { status: 400 });
      }
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: '123456',
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 });
      }
      return NextResponse.json({ error: authError.message || 'فشل إنشاء المستخدم' }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'فشل إنشاء المستخدم' }, { status: 500 });
    }

    // Create user record in users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        role,
        display_name: displayName || null,
        code: generatedCode,
        supervisor_id: supervisorId || null,
        must_change_password: true,
        created_by: user.id,
      });

    if (userError) {
      console.error('Error creating user record:', userError);
      return NextResponse.json({ error: 'فشل إنشاء سجل المستخدم' }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId: authData.user.id });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

