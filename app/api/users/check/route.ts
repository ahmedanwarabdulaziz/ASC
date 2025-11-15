import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Use admin client to bypass RLS
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('must_change_password, role, email, display_name')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json({ 
        error: 'User not found',
        details: userError.message 
      }, { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!userData) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return NextResponse.json({ user: userData }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message 
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

