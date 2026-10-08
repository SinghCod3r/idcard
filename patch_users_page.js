const fs = require('fs');
let code = fs.readFileSync('src/app/admin/users/page.tsx', 'utf8');

code = code.replace(/Invite a user/g, 'Create a user');
code = code.replace(/Invite someone/g, 'Create a user');
code = code.replace(/invite someone/g, 'create a user');
code = code.replace(
  'Create a college first, then invite an admin for it. Invitations are sent by email and the person sets their own password.',
  'Create a college first, then create an admin for it.'
);

fs.writeFileSync('src/app/admin/users/page.tsx', code);
