import Link from 'next/link'

import { cn } from '@/lib/utils'

export interface TabItem {
  key: string
  label: string
}

/**
 * Tab navigation built from links, not client state: every tab is addressable,
 * survives refresh and back navigation, and works without JavaScript. The
 * first tab is the bare url so the default view stays linkable both ways.
 */
export function TabsNav({
  tabs,
  active,
  baseUrl,
}: {
  tabs: TabItem[]
  active: string
  baseUrl: string
}) {
  return (
    <div
      role="tablist"
      className="-mx-1 flex gap-1 overflow-x-auto border-b px-1 pb-px"
    >
      {tabs.map((tab, index) => {
        const isActive = tab.key === active
        return (
          <Link
            key={tab.key}
            href={index === 0 ? baseUrl : `${baseUrl}?tab=${tab.key}`}
            role="tab"
            aria-selected={isActive}
            className={cn(
              'shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring',
              isActive
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:border-foreground/20 hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
