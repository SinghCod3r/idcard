const fs = require('fs');
let code = fs.readFileSync('src/app/admin/users/new/page.tsx', 'utf8');

code = code.replace(/inviteUserAction/g, 'createUserAction');
code = code.replace(/Invite a user/g, 'Create a user');
code = code.replace(/Invite/g, 'Create');
code = code.replace(/invite/g, 'create');
code = code.replace(
  'One college, one role. The person chooses their own password.',
  'One college, one role. You will set their initial password.'
);
code = code.replace(
  'An email with a secure link is sent. No password is written down, stored, or shown on this screen, and Super Admin cannot be handed out here.',
  'Create a new user account directly. Super Admin cannot be handed out here.'
);

fs.writeFileSync('src/app/admin/users/new/page.tsx', code);
