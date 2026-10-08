const fs = require('fs');
let code = fs.readFileSync('src/app/admin/users/invite-form.tsx', 'utf8');

code = code.replace(
  `          <TextField
            name="email"`,
  `          <TextField
            name="password"
            label="Initial Password"
            type="text"
            required
            autoComplete="off"
            disabled={isPending}
            error={state.fieldErrors?.password}
            hint="Set a password for the new user."
          />
          <TextField
            name="email"`
);

code = code.replace(
  `Send invitation`,
  `Create account`
);

fs.writeFileSync('src/app/admin/users/invite-form.tsx', code);
