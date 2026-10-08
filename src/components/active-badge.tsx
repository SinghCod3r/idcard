import { Badge } from '@/components/ui/badge'

export function ActiveBadge({ active }: { active: boolean }) {
  if (active) {
    return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80">Active</Badge>
  }
  return <Badge variant="secondary" className="bg-slate-100 text-slate-800 hover:bg-slate-100/80">Inactive</Badge>
}

