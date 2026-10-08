// Reads the live schema through PostgREST using the anon key only, and prints
// which tables exist. No service-role key, no DB password, nothing secret.
//
//   node scripts/rest-status.js
require('dotenv').config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / ANON_KEY missing from .env.local')
  process.exit(2)
}

const TABLES = [
  'profiles',
  'colleges',
  'college_members',
  'academic_sessions',
  'classes',
  'sections',
  'students',
  'student_photos',
  'id_card_templates',
  'audit_logs',
  'schools',
  'school_members',
]

async function probe(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (res.ok) return 'exists'
  const body = await res.json().catch(() => ({}))
  // 401/403 means the table is there but RLS (or missing grants) hides it.
  if (res.status === 401 || res.status === 403) return 'exists (blocked for anon)'
  if (body?.code === 'PGRST205') return 'missing'
  return `error ${res.status} ${body?.code ?? ''}`.trim()
}

async function rpc(name) {
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: '{}',
  })
  return res.ok ? `callable (${res.status})` : `not callable (${res.status})`
}

;(async () => {
  for (const table of TABLES) {
    console.log(`${table.padEnd(20)} ${(await probe(table)).padEnd(24)}`)
  }
  for (const fn of ['college_stats', 'platform_stats', 'is_super_admin']) {
    console.log(`rpc ${fn.padEnd(16)} ${await rpc(fn)}`)
  }
  const buckets = await fetch(`${url}/storage/v1/object/student-photos/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  console.log(`bucket student-photos   ${buckets.status}`)
})()
