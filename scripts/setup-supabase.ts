import { supabaseAdmin } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function setupSupabase() {
  try {
    console.log('📋 Setting up Supabase database schema...\n');
    
    // Read SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'create-supabase-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length < 10) continue; // Skip very short statements
      
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { 
          sql: statement + ';' 
        });
        
        if (error) {
          // Some errors are expected (like "already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate') ||
              error.message.includes('does not exist')) {
            console.log(`⚠️  Statement ${i + 1}: ${error.message.split('\n')[0]}`);
          } else {
            console.error(`❌ Statement ${i + 1} error:`, error.message);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err: any) {
        console.error(`❌ Statement ${i + 1} failed:`, err.message);
      }
    }
    
    console.log('\n✅ Database setup completed!');
    console.log('\n📝 Note: If you see errors, please run the SQL manually in Supabase SQL Editor:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy contents of scripts/create-supabase-tables.sql');
    console.log('   3. Paste and run in SQL Editor\n');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Setup error:', error);
    console.log('\n📝 Please run the SQL manually in Supabase SQL Editor');
    process.exit(1);
  }
}

setupSupabase();




