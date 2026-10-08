const fs = require('fs');
let code = fs.readFileSync('src/lib/db/members.ts', 'utf8');

const oldFunc = `export async function createCollegeUser(
  input: CreateUserInput
): Promise<{ userId: string; alreadyExisted: boolean }> {
  const admin = await createAdminClient()

  const normalizedEmail = input.email.trim().toLowerCase()

  const { data: existing } = await admin
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

    userId = invited.user?.id ?? null
  }

  if (!userId) throw new ActionError(FALLBACK)`;

const newFunc = `export async function createCollegeUser(
  input: CreateUserInput
): Promise<{ userId: string; alreadyExisted: boolean }> {
  const admin = await createAdminClient()

  const normalizedEmail = input.email.trim().toLowerCase()

  const { data: existing } = await admin
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

    userId = created.user?.id ?? null
  }

  if (!userId) throw new ActionError(FALLBACK)`;

code = code.replace(oldFunc, newFunc);

// Also fix alreadyInvited
code = code.replace(`return { userId, alreadyInvited: !!existing }`, `return { userId, alreadyExisted }`);

fs.writeFileSync('src/lib/db/members.ts', code);
