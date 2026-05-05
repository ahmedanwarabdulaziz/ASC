import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import fs from 'fs';

loadEnvConfig('./');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const sql = fs.readFileSync('./supabase/migrations/20260504020_facility_operating_hours.sql', 'utf8');
  const { data, error } = await supabase.rpc('execute_sql', { query: sql });
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data);
  }
}
run();
