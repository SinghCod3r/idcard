const fs = require('fs');
let code = fs.readFileSync('src/app/admin/actions.ts', 'utf8');

code = code.replace(/inviteUserAction/g, 'createUserAction');
code = code.replace(/inviteCollegeUser/g, 'createCollegeUser');

const oldAction = `export async function createUserAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction('users.invite', async () => {
    const actor = await requireSuperAdmin()

    const parsed = z
      .object({
        email: z.email({ error: 'Enter a valid email address.' }),
        name: z
          .string()
          .trim()
          .min(2, { error: 'Enter the person’s name.' })
          .max(120, { error: 'The name is too long.' }),
        college_id: uuidSchema,
      })
      .safeParse({
        email: trimmed(formData, 'email').toLowerCase(),
        name: trimmed(formData, 'name'),
        college_id: trimmed(formData, 'college_id'),
      })

    if (!parsed.success) return toFieldErrors(parsed.error)

    const { email, name, college_id } = parsed.data

    const { alreadyInvited } = await createCollegeUser(
      { email, name, collegeId: college_id, role: 'COLLEGE_ADMIN' },
      inviteRedirect()
    )

    await writeAuditEntry({
      collegeId: college_id,
      action: alreadyInvited ? 'user.reused' : 'user.invited',
      entity: 'college_members',
      entityId: null,
      details: { role: 'COLLEGE_ADMIN' },
    })

    revalidatePath('/admin/users')
    return {
      message: alreadyInvited
        ? 'That account already existed, so the college access was added without a new email. They can sign in as usual.'
        : 'Invitation sent. They set their own password when they open it.',
    }
  })
}`;

const newAction = `export async function createUserAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction('users.create', async () => {
    const actor = await requireSuperAdmin()

    const parsed = z
      .object({
        email: z.email({ error: 'Enter a valid email address.' }),
        name: z
          .string()
          .trim()
          .min(2, { error: 'Enter the person’s name.' })
          .max(120, { error: 'The name is too long.' }),
        password: z
          .string()
          .min(6, { error: 'Password must be at least 6 characters.' }),
        college_id: uuidSchema,
        role: z.enum(['COLLEGE_ADMIN', 'COLLEGE_STAFF'])
      })
      .safeParse({
        email: trimmed(formData, 'email').toLowerCase(),
        name: trimmed(formData, 'name'),
        password: trimmed(formData, 'password'),
        college_id: trimmed(formData, 'college_id'),
        role: trimmed(formData, 'role') || 'COLLEGE_ADMIN'
      })

    if (!parsed.success) return toFieldErrors(parsed.error)

    const { email, name, password, college_id, role } = parsed.data

    const { alreadyExisted } = await createCollegeUser({
      email, name, password, collegeId: college_id, role
    })

    await writeAuditEntry({
      collegeId: college_id,
      action: alreadyExisted ? 'user.reused' : 'user.created',
      entity: 'college_members',
      entityId: null,
      details: { role },
    })

    revalidatePath('/admin/users')
    return {
      message: alreadyExisted
        ? 'That account already existed, so the college access was added. They can sign in with their existing password.'
        : 'User account created successfully.',
    }
  })
}`;

code = code.replace(oldAction, newAction);
fs.writeFileSync('src/app/admin/actions.ts', code);
