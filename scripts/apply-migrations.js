// Applies supabase/migrations/*.sql in filename order against the direct
// Postgres connection, skipping anything already recorded.
//
//   SUPABASE_DB_URL=postgres://... node scripts/apply-migrations.js [file.sql]
//
// The URL must come from the environment (.env.local is git-ignored); putting it
// in this file leaves a database password in the working tree.
//
// Supabase's direct connection presents a private CA chain, so verified TLS
// needs their CA bundle (see Dashboard -> Settings -> Database). If the connect
// fails with SELF_SIGNED_CERT_IN_CHAIN, download that bundle and set
// NODE_EXTRA_CA_CERTS rather than turning verification off.
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

require('dotenv').config({ path: '.env.local' })

const connectionString = process.env.SUPABASE_DB_URL
if (!connectionString) {
  console.error('SUPABASE_DB_URL is not set (add it to .env.local).')
  process.exit(2)
}

const allowUnverified = process.env.DB_ALLOW_UNVERIFIED_SSL === '1'
const ssl = allowUnverified
  ? { rejectUnauthorized: false }
  : { rejectUnauthorized: true }

const dir = path.join(__dirname, '..', 'supabase', 'migrations')
const only = process.argv[2]

async function main() {
  const client = new Client({ connectionString, ssl })

  try {
    await client.connect()
  } catch (err) {
    console.error(`connect failed: ${err.name} ${err.code ?? err.message}`)
    if (!allowUnverified && /SELF_SIGNED|certificate/i.test(String(err.message))) {
      console.error(
        'hint: set NODE_EXTRA_CA_CERTS to Supabase CA bundle, or DB_ALLOW_UNVERIFIED_SSL=1 to override (not recommended).'
      )
    }
    process.exit(3)
  }

  await client.query(
    `create table if not exists public.schema_migrations (
       name text primary key,
       applied_at timestamptz not null default now()
     )`
  )

  const applied = new Set(
    (await client.query('select name from public.schema_migrations')).rows.map(
      (r) => r.name
    )
  )

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .filter((f) => (only ? f === only : !applied.has(f)))
    .sort()

  if (files.length === 0) {
    console.log('nothing to apply')
    await client.end()
    return
  }

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8')
    console.log(`applying ${file}`)
    try {
      await client.query('begin')
      await client.query(sql)
      await client.query(
        'insert into public.schema_migrations (name) values ($1)',
        [file]
      )
      await client.query('commit')
    } catch (err) {
      await client.query('rollback')
      console.error(`${file} failed: ${err.message}`)
      await client.end()
      process.exit(1)
    }
  }

  console.log(`applied ${files.length} file(s)`)
  await client.end()
}

main().catch((err) => {
  console.error(err.name === 'Error' ? err.message : err)
  process.exit(1)
})
