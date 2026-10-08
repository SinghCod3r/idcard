// Row counts through the service-role REST client, so RLS cannot hide the
// state we are trying to verify. Prints counts and college codes only —
// never the key, never an email address, never a row of student data.
//
//   node scripts/seed-status.js
require('dotenv').config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing')
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
]

async function count(table) {
  const res = await fetch(
    `${url}/rest/v1/${table}?select=id`,
    { headers: { apikey: key, Authorization: `Bearer ${key}`, prefer: 'count=exact' }, }
  )
  if (!res.ok) return `HTTP ${res.status}`
  const range = res.headers.get('content-range') ?? ''
  return range.split('/')[1] ?? String((await res.json()).length)
}

async function colleges() {
  const res = await fetch(`${url}/rest/v1/colleges?select=code,name,status&order=code`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (!res.ok) return `HTTP ${res.status}`
  return (await res.json()).map((c) => `${c.code}/${c.status}`)
}

;(async () => {
  for (const t of TABLES) console.log(`${t.padEnd(18)} ${await count(t)}`)
  console.log('colleges:', await colleges())
})()
