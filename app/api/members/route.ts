import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit') || '1000';
    const limit = parseInt(limitParam, 10);
    const searchQuery = searchParams.get('q') || '';
    const searchColumn = searchParams.get('column') || 'all';

    let query = supabaseAdmin
      .from('members')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // If search query provided, use advanced Arabic search
    if (searchQuery && searchQuery.trim().length > 0) {
      // If specific column selected, filter by that column
      if (searchColumn !== 'all') {
        let columnName = '';
        switch (searchColumn) {
          case 'name':
            // Search BOTH original name and normalized name_search
            query = supabaseAdmin
              .from('members')
              .select('*')
              .or(`name.ilike.%${searchQuery}%,name_search.ilike.%${searchQuery}%`)
              .order('created_at', { ascending: false })
              .limit(limit);
            break;
          case 'address':
            // Search BOTH original address and normalized address_search
            query = supabaseAdmin
              .from('members')
              .select('*')
              .or(`address.ilike.%${searchQuery}%,address_search.ilike.%${searchQuery}%`)
              .order('created_at', { ascending: false })
              .limit(limit);
            break;
          case 'job':
            // Search BOTH original job and normalized job_search
            query = supabaseAdmin
              .from('members')
              .select('*')
              .or(`job.ilike.%${searchQuery}%,job_search.ilike.%${searchQuery}%`)
              .order('created_at', { ascending: false })
              .limit(limit);
            break;
          case 'mobile':
            columnName = 'mobile';
            break;
          case 'phone':
            columnName = 'phone';
            break;
          case 'member_id':
            columnName = 'member_id';
            break;
        }
        
        if (columnName) {
          query = supabaseAdmin
            .from('members')
            .select('*')
            .ilike(columnName, `%${searchQuery}%`)
            .order('created_at', { ascending: false })
            .limit(limit);
        }
      } else {
        // Search all columns using search_members function
        const { data, error } = await supabaseAdmin.rpc('search_members', {
          search_query: searchQuery.trim()
        });

        if (error) {
          console.error('Search function error:', error);
          // Fallback: Search ORIGINAL columns directly (ensures no names missed)
          query = supabaseAdmin
            .from('members')
            .select('*')
            .or(`name.ilike.%${searchQuery}%,name_search.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,address_search.ilike.%${searchQuery}%,job.ilike.%${searchQuery}%,job_search.ilike.%${searchQuery}%,mobile.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,member_id.ilike.%${searchQuery}%`)
            .order('created_at', { ascending: false })
            .limit(limit);
        } else {
          // search_members function returns results with rank and match_type
          // Results are already sorted by relevance
          return NextResponse.json({ 
            success: true, 
            members: data || [],
            count: data?.length || 0 
          });
        }
      }
    }

    const { data: members, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      members: members || [],
      count: members?.length || 0 
    });
  } catch (error: any) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: `Error: ${error.message}` },
      { status: 500 }
    );
  }
}

