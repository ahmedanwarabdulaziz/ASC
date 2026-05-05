import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
loadEnvConfig('./');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const staffRes = await supabase.from('staff_members').select('id, status, people:person_id(first_name, second_name, last_name), staff_jobs!inner(is_training_sector)').eq('status', 'active').eq('staff_jobs.is_training_sector', true);
  console.log(JSON.stringify(staffRes, null, 2));
}
run();
