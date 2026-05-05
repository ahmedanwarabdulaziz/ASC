import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
const envVars = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => line.split('=').map(part => part.trim()))
);

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('cms_articles')
    .select(`
      *,
      cms_categories (name),
      author:author_id (email, raw_user_meta_data)
    `)
    .order('created_at', { ascending: false });
    
  console.log('Error:', error);
}
test();
