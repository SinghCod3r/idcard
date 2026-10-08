require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function updatePasswords() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  
  for (const u of data.users) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(u.id, { password: 'admin@123' });
    if (updateError) {
      console.error(`Error updating password for ${u.email}:`, updateError);
    } else {
      console.log(`Updated password for ${u.email} to admin@123`);
    }
  }
}

updatePasswords();

