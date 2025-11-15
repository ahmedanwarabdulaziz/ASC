import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    const sqlPath = path.join(process.cwd(), 'supabase-migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith('--'));
    
    const results: string[] = [];
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.length < 20) continue;
      
      const fullStatement = statement + ';';
      
      try {
        // Use Supabase REST API to execute SQL
        const response = await fetch(
          `https://xkbiqoajqxlvxjcwvhzv.supabase.co/rest/v1/rpc/exec_sql`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYmlxb2FqcXhsdnhqY3d2aHp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE5NTEzOSwiZXhwIjoyMDc4NzcxMTM5fQ.q-Q41xN8vhc2_sA8q2tVqKvoKLNWOv8o065DPgUBb3k',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYmlxb2FqcXhsdnhqY3d2aHp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE5NTEzOSwiZXhwIjoyMDc4NzcxMTM5fQ.q-Q41xN8vhc2_sA8q2tVqKvoKLNWOv8o065DPgUBb3k'}`
            },
            body: JSON.stringify({ sql: fullStatement })
          }
        );
        
        if (response.ok) {
          results.push('✅ Executed successfully');
        } else {
          const errorText = await response.text();
          if (errorText.includes('already exists') || errorText.includes('duplicate')) {
            results.push('⚠️  Already exists (OK)');
          } else {
            results.push(`❌ Error: ${errorText.substring(0, 100)}`);
          }
        }
      } catch (error: any) {
        results.push(`❌ ${error.message}`);
      }
    }
    
    // Verify tables
    const { data: members, error: membersError } = await supabaseAdmin
      .from('members')
      .select('id')
      .limit(1);
    
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('teams')
      .select('id')
      .limit(1);
    
    return NextResponse.json({
      success: true,
      message: 'SQL execution attempted',
      results,
      tables: {
        members: !membersError,
        teams: !teamsError
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}


