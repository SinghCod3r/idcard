import { FilterBar } from '@/components/filters/filter-bar'
import type { MyClass } from '@/types'

export interface StudentFilterValues {
  search: string
  classId?: string
}

export function StudentFilters({
  baseUrl,
  classes,
  values,
  extraQuery,
  hideClassFilter,
}: {
  baseUrl: string
  classes: MyClass[]
  values: StudentFilterValues
  extraQuery?: Record<string, string>
  hideClassFilter?: boolean
}) {
  const fields = hideClassFilter ? [] : [
    {
      name: 'class',
      label: 'Class',
      value: values.classId ?? '',
      options: [
        { value: '', label: 'Any class' },
        ...classes.map((item) => ({ value: item.id, label: item.name })),
      ],
    },
  ]

  return (
    <FilterBar
      baseUrl={baseUrl}
      search={values.search}
      searchPlaceholder="Name, roll number, or phone"
      fields={fields}
      extraFields={extraQuery}
    />
  )
}
