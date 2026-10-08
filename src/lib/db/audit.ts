import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { describeDbError } from './errors'

export interface AuditInput {
  collegeId?: string | null
  action: string
  entity: string
  entityId?: string | null
  details?: Record<string, unknown>
}

export interface AuditEntry {
  id: number
  action: string
  entity: string
  created_at: string
  actor: { name: string | null; email: string } | null
}

/**
 * Append-only trail of the actions the spec asks us to track. actor_id comes
 * from the JWT default, so it cannot be forged through the API, and the table
 * has no update or delete policy.
 */
export async function writeAuditEntry(input: AuditInput): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('audit_logs').insert({
    college_id: input.collegeId ?? null,
    action: input.action,
    entity: input.entity,
    entity_id: input.entityId ?? null,
    details: input.details ?? {},
  })

  if (error) {
    throw describeDbError('audit.write', error)
  }
}

export async function listAuditLogs(
  collegeId: string | null,
  limit = 50
): Promise<AuditEntry[]> {
  const supabase = await createClient()

  let query = supabase
    .from('audit_logs')
    .select('id, action, entity, created_at, actor:profiles(name, email)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (collegeId) query = query.eq('college_id', collegeId)

  const { data, error } = await query
  if (error) throw describeDbError('audit.list', error)

  return (data ?? []) as unknown as AuditEntry[]
}
