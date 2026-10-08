require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function listUsers() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  console.log('Users:');
  data.users.forEach(u => {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Role: ${u.role}`);
  });
  
  console.log('\nProfiles:');
  const profiles = await supabase.from('profiles').select('*');
  console.log(profiles.data);
}

listUsers();

