import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
loadEnvConfig('./');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const groups = await supabase.from('training_groups').select('id').limit(1);
  const areas = await supabase.from('facility_areas').select('id').limit(1);
  const groupId = groups.data![0].id;
  const areaId = areas.data![0].id;

  const { error: err1 } = await supabase.from('training_group_sessions').insert({
    training_group_id: groupId,
    day_of_week: 1,
    start_time: '14:00',
    end_time: '16:00',
    facility_area_id: areaId
  });
  console.log('Insert 1:', err1 ? err1.message : 'Success');

  const { error: err2 } = await supabase.from('training_group_sessions').insert({
    training_group_id: groupId,
    day_of_week: 1,
    start_time: '14:00',
    end_time: '16:00',
    facility_area_id: areaId
  });
  console.log('Insert 2:', err2 ? err2.message : 'Success');
}
run();
