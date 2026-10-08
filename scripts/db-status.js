// Read-only check of what actually exists in the hosted database.
// Prints schema facts only; never prints the connection string or any secret.
//
//   SUPABASE_DB_URL=postgres://... node scripts/db-status.js
//
// If SUPABASE_DB_URL is absent it falls back to the legacy scratch file at the
// repo root so the password is not copied into this script.
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

function resolveConnectionString() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL
  const legacy = path.join(__dirname, '..', 'run-migrations.js')
  if (!fs.existsSync(legacy)) return null
  const match = fs
    .readFileSync(legacy, 'utf8')
    .match(/postgres:\/\/[^'"`\s]+/)
  return match ? match[0] : null
}

const url = resolveConnectionString()
if (!url) {
  console.error('No SUPABASE_DB_URL available.')
  process.exit(2)
}

const EXPECTED_TABLES = [
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

const QUERIES = {
  'tables present': `select table_name from information_schema.tables
     where table_schema = 'public' order by table_name`,
  'rls enabled': `select c.relname, c.relrowsecurity from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' order by c.relname`,
  policies: `select tablename, policyname, cmd from pg_policies
     where schemaname = 'public' order by tablename, policyname`,
  'public functions': `select p.proname, pg_catalog.pg_get_function_arguments(p.oid) as args
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' order by p.proname`,
  'storage buckets': `select id, public, file_size_limit, allowed_mime_types from storage.buckets order by id`,
  'storage policies': `select policyname, cmd from pg_policies
     where schemaname = 'storage' and tablename = 'objects'`,
  'triggers (public)': `select tg.tgname, c.relname from pg_trigger tg
     join pg_class c on c.oid = tg.relid
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and not tg.tgisinternal order by c.relname, tg.tgname`,
  'unique indexes': `select c.relname as indexname, t.relname as on_table,
     pg_get_indexdef(c.oid) as definition
     from pg_class c join pg_index i on i.indexrelid = c.oid
     join pg_class t on t.oid = i.indrelid
     join pg_namespace n on n.oid = t.relnamespace
     where n.nspname = 'public' and i.indisunique order by t.relname, c.relname`,
  'function grants (non-default)': `select p.proname, pg_catalog.array_to_string(p.proacl, ', ') as acl
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proacl is not null order by p.proname`,
  colleges: `select id, name, code, status from public.colleges order by name`,
  members: `select m.role, m.status, c.code, p.email from public.college_members m
     join public.profiles p on p.id = m.user_id
     join public.colleges c on c.id = m.college_id order by c.code, p.email`,
  counts: `select
     (select count(*) from public.profiles) as profiles,
     (select count(*) from public.colleges) as colleges,
     (select count(*) from public.students) as students,
     (select count(*) from public.audit_logs) as audit_logs`,
  'legacy school tables': `select table_name from information_schema.tables
     where table_schema = 'public' and table_name in ('schools','school_members')`,
}

async function main() {
  const client = new Client({
    connectionString: url,
    ssl:
      process.env.DB_ALLOW_UNVERIFIED_SSL === '1'
        ? { rejectUnauthorized: false }
        : { rejectUnauthorized: true },
  })

  try {
    await client.connect()
  } catch (err) {
    console.error(`connect failed: ${err.name} ${err.code ?? ''}`.trim())
    console.error(
      'hint: set NODE_EXTRA_CA_CERTS to Supabase CA bundle, or DB_ALLOW_UNVERIFIED_SSL=1 to override (not recommended).'
    )
    process.exit(3)
  }

  console.log(
    `connected (${process.env.DB_ALLOW_UNVERIFIED_SSL === '1' ? 'TLS verification OFF' : 'TLS verified'})`
  )

  const only = process.argv[2]
  for (const [label, sql] of Object.entries(QUERIES)) {
    if (only && !label.includes(only)) continue
    try {
      const { rows } = await client.query(sql)
      console.log(`\n## ${label}: ${rows.length}`)
      for (const row of rows) console.log('   ' + JSON.stringify(row))
    } catch (err) {
      console.log(`\n## ${label}: ERROR ${err.message}`)
    }
  }

  const present = new Set(
    (
      await client.query(
        `select table_name from information_schema.tables where table_schema = 'public'`
      )
    ).rows.map((r) => r.table_name)
  )
  console.log('\n## expected tables missing:', EXPECTED_TABLES.filter((t) => !present.has(t)))

  await client.end()
}

main().catch((err) => {
  console.error(`failed: ${err.name} ${err.message}`)
  process.exit(1)
})
