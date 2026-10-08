const fs = require('fs');
let code = fs.readFileSync('src/lib/db/members.ts', 'utf8');

code = code.replace(
  `export interface InviteInput {
  email: string
  name: string
  collegeId: string
  role: 'COLLEGE_ADMIN' | 'COLLEGE_STAFF'
}`,
  `export interface CreateUserInput {
  email: string
  name: string
  password?: string
  collegeId: string
  role: 'COLLEGE_ADMIN' | 'COLLEGE_STAFF'
}`
);

code = code.replace(
  `export async function inviteCollegeUser(
  input: InviteInput,
  redirectTo: string
): Promise<{ userId: string; alreadyInvited: boolean }> {`,
  `export async function createCollegeUser(
  input: CreateUserInput
): Promise<{ userId: string; alreadyExisted: boolean }> {`
);

const oldInviteLogic = `  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  let userId = existing?.id ?? null

  if (!userId) {
    const { data: invited, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(normalizedEmail, {
        data: { name: input.name.trim() },
        redirectTo,
      })

    if (inviteError) {
      console.error('[users] invite failed', inviteError.status ?? inviteError.name)
      throw new ActionError(
        inviteError.message.toLowerCase().includes('rate limit')
          ? 'Too many invitations were sent recently. Please try again later.'
          : 'We could not send the invitation. Please check the email address and try again.'
      )
    }

    if (!invited.user) throw new ActionError(FALLBACK)
    userId = invited.user.id
  }`;

const newCreateLogic = `  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  let userId = existing?.id ?? null
  let alreadyExisted = !!userId

  if (!userId) {
    if (!input.password) {
      throw new ActionError('A password is required for new users.')
    }
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email: normalizedEmail,
        password: input.password,
        email_confirm: true,
        user_metadata: { name: input.name.trim() }
      })

    if (createError) {
      console.error('[users] create failed', createError.status ?? createError.name)
      throw new ActionError(
        createError.message || 'We could not create the account. Please check the email address and try again.'
      )
    }

    if (!created.user) throw new ActionError(FALLBACK)
    userId = created.user.id
  } else if (input.password) {
     // Optional: update password if it exists? The user asked for editing password. 
     // We will create a separate function for that.
  }`;

code = code.replace(oldInviteLogic, newCreateLogic);

code = code.replace(
  `  return { userId, alreadyInvited: !!existing }`,
  `  return { userId, alreadyExisted }`
);

fs.writeFileSync('src/lib/db/members.ts', code);
