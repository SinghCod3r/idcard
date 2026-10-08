import { requireCollegeMember } from '@/lib/authz/guards'
import { listClasses } from '@/lib/db/academic'
import { saveClassAction, deleteClassAction } from '@/app/app/actions'
import { QuickForm } from '@/components/forms/quick-form'
import { ActionForm } from '@/components/forms/action-form'
import { Card, PageHeader } from '@/components/section'

export const metadata = { title: 'Classes' }

export default async function ClassesPage() {
  const { college } = await requireCollegeMember()
  const classes = await listClasses(college.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        description="The years, grades, or programs in this college."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Existing classes</h2>
          {classes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No classes yet.</p>
          ) : (
            classes.map((cls) => (
              <Card key={cls.id}>
                <QuickForm
                  action={saveClassAction}
                  submitLabel="Save changes"
                  className="mb-4"
                  fields={[
                    { kind: 'hidden', name: 'id', value: cls.id },
                    {
                      kind: 'text',
                      name: 'name',
                      label: 'Class name',
                      defaultValue: cls.name,
                      required: true,
                    },
                    {
                      kind: 'text',
                      name: 'order_index',
                      label: 'Order',
                      defaultValue: cls.order_index.toString(),
                      hint: 'Lower numbers appear first',
                    },
                  ]}
                />
                <div className="border-t pt-4">
                  <ActionForm
                    action={deleteClassAction}
                    fields={{ id: cls.id }}
                    label="Delete class"
                    variant="destructive"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    You can only delete a class if no students belong to it.
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Add a class</h2>
          <Card>
            <QuickForm
              action={saveClassAction}
              submitLabel="Add class"
              fields={[
                {
                  kind: 'text',
                  name: 'name',
                  label: 'Class name',
                  placeholder: 'e.g. Class 10, Year 1, B.Tech',
                  required: true,
                },
                {
                  kind: 'text',
                  name: 'order_index',
                  label: 'Order',
                  defaultValue: '10',
                  hint: 'Lower numbers appear first in dropdowns',
                },
              ]}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}

