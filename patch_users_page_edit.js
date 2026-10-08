const fs = require('fs');
let code = fs.readFileSync('src/app/admin/users/page.tsx', 'utf8');

const oldActions = `                        <ActionForm
                          action={setUserActiveAction}
                          fields={{
                            user_id: user.user_id,
                            active: user.is_active ? '0' : '1',
                            college_id: user.college_id,
                          }}
                          label={user.is_active ? 'Deactivate' : 'Activate'}
                          variant={user.is_active ? 'destructive' : 'default'}
                        />
                      </div>`;

const newActions = `                        <ActionForm
                          action={setUserActiveAction}
                          fields={{
                            user_id: user.user_id,
                            active: user.is_active ? '0' : '1',
                            college_id: user.college_id,
                          }}
                          label={user.is_active ? 'Deactivate' : 'Activate'}
                          variant={user.is_active ? 'destructive' : 'default'}
                        />
                        <Link
                          href={\`/admin/users/\${user.user_id}/password\`}
                          className={buttonVariants({ variant: 'outline', size: 'sm' })}
                        >
                          Password
                        </Link>
                      </div>`;

code = code.replace(oldActions, newActions);
fs.writeFileSync('src/app/admin/users/page.tsx', code);
