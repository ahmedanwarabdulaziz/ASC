import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
loadEnvConfig('./');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { data, error } = await supabase.from('training_group_sessions').insert({
    training_group_id: 'e0129792-7fcc-47e2-8868-b7c12ff216ad', // I'll get a real group id first
    day_of_week: 1,
    start_time: '14:00',
    end_time: '16:00',
    facility_area_id: '86fbbfec-c038-4e89-bdc0-0ed5c179d671' // I'll get a real area id
  });
  console.log('Error:', error);
}
run();
