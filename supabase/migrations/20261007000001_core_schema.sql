-- Multi-tenant college schema.
-- Supersedes 20261006000000 (never applied to this project; preserved under supabase/.superseded/).

create extension if not exists "pg_trgm" with schema "extensions";

-- ---------------------------------------------------------------------------
-- Trigger plumbing
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: global identity. Global tier only; college authority lives in
-- college_members so a user's reach has exactly one source of truth.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text not null,
  role text not null default 'COLLEGE_USER'
    check (role in ('SUPER_ADMIN', 'COLLEGE_USER')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- colleges --------------------------------------------------------------------

create table public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  address text,
  contact_name text,
  contact_email text,
  phone text,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index colleges_name_idx on public.colleges (lower(name));

create trigger colleges_set_updated_at
  before update on public.colleges
  for each row execute function public.set_updated_at();

-- college_members: the authoritative user -> college relationship. -----------
-- Exactly one ACTIVE membership per user, so the tenant boundary cannot be
-- widened by adding rows, and it is never derived from email or request input.

create table public.college_members (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('COLLEGE_ADMIN', 'COLLEGE_STAFF')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index college_members_one_active_per_user_idx
  on public.college_members (user_id)
  where status = 'ACTIVE';

create unique index college_members_college_user_idx
  on public.college_members (college_id, user_id);

create index college_members_user_idx on public.college_members (user_id);
create index college_members_college_idx on public.college_members (college_id);

create trigger college_members_set_updated_at
  before update on public.college_members
  for each row execute function public.set_updated_at();

-- academic_sessions -----------------------------------------------------------

create table public.academic_sessions (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges (id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (college_id, name)
);

create index academic_sessions_college_idx on public.academic_sessions (college_id);

-- classes ---------------------------------------------------------------------

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges (id) on delete cascade,
  name text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  unique (college_id, name)
);

create index classes_college_idx on public.classes (college_id, order_index);

-- sections: scoped through their class, which is scoped to a college. ---------

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (class_id, name)
);

create index sections_class_idx on public.sections (class_id);

-- students --------------------------------------------------------------------

create table public.students (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges (id) on delete cascade,
  academic_session_id uuid not null references public.academic_sessions (id),
  class_id uuid not null references public.classes (id),
  section_id uuid references public.sections (id),

  full_name text not null,
  date_of_birth date,
  gender text check (gender in ('MALE', 'FEMALE', 'OTHER')),
  blood_group text,
  father_name text,
  mother_name text,
  guardian_name text,
  phone text,
  address text,

  admission_number text,
  roll_number text,
  registration_number text,
  course text,

  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')),
  card_status text not null default 'PENDING'
    check (card_status in ('PENDING', 'READY_FOR_PRINT', 'PRINTED')),
  rejection_reason text,
  is_archived boolean not null default false,

  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (college_id, academic_session_id, admission_number)
);

create index students_college_idx on public.students (college_id);
create index students_lookup_idx
  on public.students (college_id, academic_session_id, class_id, section_id)
  where not is_archived;
create index students_admission_idx on public.students (college_id, admission_number);
create index students_name_trgm_idx
  on public.students using gin (full_name extensions.gin_trgm_ops);
create index students_archived_idx on public.students (college_id, is_archived);

create trigger students_set_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

-- Academic placement must all belong to the student's own college; otherwise a
-- crafted request could attach a student to another college's class tree.
create or replace function public.enforce_student_academic_consistency()
returns trigger
language plpgsql
as $$
declare
  v_session_college uuid;
  v_class_college uuid;
  v_section_class uuid;
begin
  select college_id into v_session_college
  from public.academic_sessions where id = new.academic_session_id;

  if v_session_college is distinct from new.college_id then
    raise exception 'academic session does not belong to this college'
      using errcode = '23514';
  end if;

  select college_id into v_class_college
  from public.classes where id = new.class_id;

  if v_class_college is distinct from new.college_id then
    raise exception 'class does not belong to this college'
      using errcode = '23514';
  end if;

  if new.section_id is not null then
    select class_id into v_section_class
    from public.sections where id = new.section_id;

    if v_section_class is distinct from new.class_id then
      raise exception 'section does not belong to this class'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger students_academic_consistency
  before insert or update on public.students
  for each row execute function public.enforce_student_academic_consistency();

-- A COLLEGE_STAFF member may add and correct students, but may not approve or
-- reject records, move cards to print, or archive them: those are admin actions.
create or replace function public.enforce_student_workflow_permissions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_admin boolean;
begin
  select public.is_super_admin()
    or public.is_college_admin(old.college_id) into v_is_admin;

  if v_is_admin then
    return new;
  end if;

  if new.status is distinct from old.status
     or new.card_status is distinct from old.card_status
     or new.is_archived is distinct from old.is_archived then
    raise exception 'only a college admin can change review or print status'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger students_workflow_permissions
  before update on public.students
  for each row execute function public.enforce_student_workflow_permissions();

-- student_photos: rows describe files in private storage. ----------------------

create table public.student_photos (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  college_id uuid not null references public.colleges (id) on delete cascade,
  storage_path text not null unique,
  mime_type text,
  file_size bigint,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index student_photos_college_idx on public.student_photos (college_id);
create index student_photos_student_idx on public.student_photos (student_id);

create trigger student_photos_set_updated_at
  before update on public.student_photos
  for each row execute function public.set_updated_at();

-- The storage path must start with the owning college's id, which is what the
-- storage policies key on for cross-tenant denial.
create or replace function public.enforce_student_photo_path()
returns trigger
language plpgsql
as $$
begin
  if new.storage_path not like new.college_id::text || '/%' then
    raise exception 'photo path must be inside the owning college folder'
      using errcode = '23514';
  end if;

  if new.college_id is distinct from
     (select college_id from public.students where id = new.student_id) then
    raise exception 'photo college does not match the student college'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger student_photos_path_consistency
  before insert or update on public.student_photos
  for each row execute function public.enforce_student_photo_path();

-- id_card_templates: college_id null means a platform-wide template. ----------

create table public.id_card_templates (
  id uuid primary key default gen_random_uuid(),
  college_id uuid references public.colleges (id) on delete cascade,
  name text not null,
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index id_card_templates_college_idx on public.id_card_templates (college_id);

create trigger id_card_templates_set_updated_at
  before update on public.id_card_templates
  for each row execute function public.set_updated_at();

-- audit_logs: append-only; no update or delete policies exist in RLS. ---------

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid not null default auth.uid() references public.profiles (id),
  college_id uuid references public.colleges (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_college_idx on public.audit_logs (college_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Profile bootstrap on signup. Role stays COLLEGE_USER: signing up never
-- grants college access, which only a Super Admin assignment can do.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), new.raw_user_meta_data ->> 'full_name'),
    'COLLEGE_USER'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger-only: must not be callable through the API, where it would let a
-- caller mint profiles.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Nobody may flip profiles.role through ordinary DML. Only a direct database
-- session (bootstrap/seed), the service role, or an existing Super Admin can,
-- so a College Admin cannot promote themselves.
-- ---------------------------------------------------------------------------

create or replace function public.is_privileged_session()
returns boolean
language sql
stable
as $$
  select coalesce(
    current_setting('request.jwt.claim.role', true),
    ''
  ) in ('', 'service_role')
$$;

create or replace function public.enforce_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    if not (
      public.is_privileged_session()
      or public.is_super_admin()
    ) then
      raise exception 'only a super admin can change the global role'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_role_guard
  before update on public.profiles
  for each row execute function public.enforce_profile_role_change();
