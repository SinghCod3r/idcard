import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key) env[key.trim()] = val.join('=').trim().replace(/"/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('classes').select('*');
  console.log(data);
}
run();
