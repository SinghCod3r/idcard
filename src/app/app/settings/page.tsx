import { requireCollegeMember } from '@/lib/authz/guards'
import { getCollege } from '@/lib/db/colleges'
import { updateOwnProfileAction } from '@/app/app/actions'
import { QuickForm } from '@/components/forms/quick-form'
import { Card, PageHeader } from '@/components/section'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const { user, college: membership } = await requireCollegeMember()
  
  // Fetch full college details to show read-only facts
  const collegeDetails = await getCollege(membership.id)
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Your profile and college details."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Your profile" description="How your name appears across the platform.">
          <QuickForm
            action={updateOwnProfileAction}
            submitLabel="Save profile"
            fields={[
              {
                kind: 'text',
                name: 'name',
                label: 'Display name',
                defaultValue: user.name || '',
                required: true,
              },
            ]}
          />
          <div className="mt-6 border-t pt-4">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium">{user.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Your role in this college</dt>
                <dd className="font-medium">{membership.role.replace('COLLEGE_', '')}</dd>
              </div>
            </dl>
          </div>
        </Card>

        <Card title="College details" description="Read-only information about your assigned college.">
          {collegeDetails ? (
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">College Name</dt>
                <dd className="font-medium">{collegeDetails.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">College Code</dt>
                <dd className="font-medium">{collegeDetails.code}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Contact</dt>
                <dd className="font-medium">
                  {collegeDetails.contact_name || '—'}
                  {collegeDetails.contact_email && ` (${collegeDetails.contact_email})`}
                  {collegeDetails.phone && ` · ${collegeDetails.phone}`}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Address</dt>
                <dd className="font-medium">{collegeDetails.address || '—'}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">College details not available.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
