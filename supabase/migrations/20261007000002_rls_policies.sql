-- Row Level Security: helpers first, then per-command policies for every table.
-- Every policy states both USING (which existing row) and WITH CHECK (what the
-- written row may look like), so a request cannot be retargeted at another
-- college by editing college_id in the body, query string, or path.

-- ---------------------------------------------------------------------------
-- Helpers. SECURITY DEFINER so they read the membership graph without the
-- RLS recursion that would otherwise lock out the very rows they check.
-- ---------------------------------------------------------------------------

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'SUPER_ADMIN'
      and p.is_active
  );
$$;

-- Active college ids for the current user, straight from college_members.
-- Never from the email domain, the URL, or anything a client sends. A college
-- the operator has deactivated drops every member's access at the row level.
create or replace function public.auth_college_ids()
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    array_agg(m.college_id),
    '{}'::uuid[]
  )
  from public.college_members m
  join public.profiles p on p.id = m.user_id
  join public.colleges c on c.id = m.college_id
  where m.user_id = auth.uid()
    and m.status = 'ACTIVE'
    and p.is_active
    and c.status = 'ACTIVE';
$$;

create or replace function public.belongs_to_college(p_college_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_college_id is not null
    and (
      public.is_super_admin()
      or p_college_id = any (public.auth_college_ids())
    );
$$;

create or replace function public.is_college_admin(p_college_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_college_id is not null and exists (
    select 1
    from public.college_members m
    join public.profiles p on p.id = m.user_id
    join public.colleges c on c.id = m.college_id
    where m.user_id = auth.uid()
      and m.college_id = p_college_id
      and m.role = 'COLLEGE_ADMIN'
      and m.status = 'ACTIVE'
      and p.is_active
      and c.status = 'ACTIVE'
  );
$$;

create or replace function public.class_college(p_class_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.college_id from public.classes c where c.id = p_class_id;
$$;

create or replace function public.section_college(p_section_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.college_id
  from public.sections s
  join public.classes c on c.id = s.class_id
  where s.id = p_section_id;
$$;

create or replace function public.shares_college_with(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.college_members a
    join public.college_members b on b.college_id = a.college_id
    where a.user_id = auth.uid()
      and a.status = 'ACTIVE'
      and b.user_id = p_profile_id
      and b.status = 'ACTIVE'
  );
$$;

alter function public.is_super_admin() owner to postgres;
alter function public.auth_college_ids() owner to postgres;
alter function public.belongs_to_college(uuid) owner to postgres;
alter function public.is_college_admin(uuid) owner to postgres;
alter function public.class_college(uuid) owner to postgres;
alter function public.section_college(uuid) owner to postgres;
alter function public.shares_college_with(uuid) owner to postgres;

-- ---------------------------------------------------------------------------
-- Membership identity guard: reassigning a user to a different college, or
-- moving a membership onto a different person, is Super Admin only.
-- ---------------------------------------------------------------------------

create or replace function public.enforce_membership_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.college_id is distinct from old.college_id
      or new.user_id is distinct from old.user_id)
     and not (public.is_privileged_session() or public.is_super_admin()) then
    raise exception 'only a super admin can move a membership between colleges or users'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger college_members_identity_guard
  before update on public.college_members
  for each row execute function public.enforce_membership_identity();

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.colleges enable row level security;
alter table public.college_members enable row level security;
alter table public.academic_sessions enable row level security;
alter table public.classes enable row level security;
alter table public.sections enable row level security;
alter table public.students enable row level security;
alter table public.student_photos enable row level security;
alter table public.id_card_templates enable row level security;
alter table public.audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy profiles_select on public.profiles
  for select
  using (
    id = auth.uid()
    or public.is_super_admin()
    or public.shares_college_with(id)
  );

create policy profiles_update_self on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_update_super_admin on public.profiles
  for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- No insert policy: rows come from handle_new_user(). No delete policy.

-- ---------------------------------------------------------------------------
-- colleges
-- ---------------------------------------------------------------------------

create policy colleges_select on public.colleges
  for select
  using (
    public.is_super_admin()
    or id = any (public.auth_college_ids())
  );

create policy colleges_insert on public.colleges
  for insert
  with check (public.is_super_admin());

create policy colleges_update on public.colleges
  for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy colleges_delete on public.colleges
  for delete
  using (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- college_members
-- ---------------------------------------------------------------------------

create policy college_members_select on public.college_members
  for select
  using (
    user_id = auth.uid()
    or public.is_super_admin()
    or public.is_college_admin(college_id)
  );

-- A college admin may only add members to a college they admin; the one-active-
-- membership-per-user index stops them from also keeping another college's user.
create policy college_members_insert on public.college_members
  for insert
  with check (
    public.is_super_admin()
    or public.is_college_admin(college_id)
  );

create policy college_members_update on public.college_members
  for update
  using (
    public.is_super_admin()
    or public.is_college_admin(college_id)
  )
  with check (
    public.is_super_admin()
    or public.is_college_admin(college_id)
  );

create policy college_members_delete on public.college_members
  for delete
  using (
    public.is_super_admin()
    or public.is_college_admin(college_id)
  );

-- ---------------------------------------------------------------------------
-- academic_sessions, classes
-- ---------------------------------------------------------------------------

create policy academic_sessions_select on public.academic_sessions
  for select
  using (public.belongs_to_college(college_id));

create policy academic_sessions_insert on public.academic_sessions
  for insert
  with check (
    public.is_super_admin() or public.is_college_admin(college_id)
  );

create policy academic_sessions_update on public.academic_sessions
  for update
  using (
    public.is_super_admin() or public.is_college_admin(college_id)
  )
  with check (
    public.is_super_admin() or public.is_college_admin(college_id)
  );

create policy academic_sessions_delete on public.academic_sessions
  for delete
  using (
    public.is_super_admin() or public.is_college_admin(college_id)
  );

create policy classes_select on public.classes
  for select
  using (public.belongs_to_college(college_id));

create policy classes_insert on public.classes
  for insert
  with check (
    public.is_super_admin() or public.is_college_admin(college_id)
  );

create policy classes_update on public.classes
  for update
  using (
    public.is_super_admin() or public.is_college_admin(college_id)
  )
  with check (
    public.is_super_admin() or public.is_college_admin(college_id)
  );

create policy classes_delete on public.classes
  for delete
  using (
    public.is_super_admin() or public.is_college_admin(college_id)
  );

-- ---------------------------------------------------------------------------
-- sections (scoped through their class)
-- ---------------------------------------------------------------------------

create policy sections_select on public.sections
  for select
  using (public.belongs_to_college(public.class_college(class_id)));

create policy sections_insert on public.sections
  for insert
  with check (
    public.is_super_admin()
    or public.is_college_admin(public.class_college(class_id))
  );

create policy sections_update on public.sections
  for update
  using (public.belongs_to_college(public.class_college(class_id)))
  with check (
    public.is_super_admin()
    or public.is_college_admin(public.class_college(class_id))
  );

create policy sections_delete on public.sections
  for delete
  using (public.belongs_to_college(public.class_college(class_id)));

-- ---------------------------------------------------------------------------
-- students
-- Staff read, add, and correct students in their own college. They cannot
-- delete, and the workflow trigger stops status/card_status/archive changes.
-- ---------------------------------------------------------------------------

create policy students_select on public.students
  for select
  using (public.belongs_to_college(college_id));

create policy students_insert on public.students
  for insert
  with check (public.belongs_to_college(college_id));

create policy students_update on public.students
  for update
  using (public.belongs_to_college(college_id))
  with check (public.belongs_to_college(college_id));

create policy students_delete on public.students
  for delete
  using (
    public.is_super_admin() or public.is_college_admin(college_id)
  );

-- ---------------------------------------------------------------------------
-- student_photos
-- ---------------------------------------------------------------------------

create policy student_photos_select on public.student_photos
  for select
  using (public.belongs_to_college(college_id));

create policy student_photos_insert on public.student_photos
  for insert
  with check (public.belongs_to_college(college_id));

create policy student_photos_update on public.student_photos
  for update
  using (public.belongs_to_college(college_id))
  with check (public.belongs_to_college(college_id));

create policy student_photos_delete on public.student_photos
  for delete
  using (public.belongs_to_college(college_id));

-- ---------------------------------------------------------------------------
-- id_card_templates
-- ---------------------------------------------------------------------------

create policy id_card_templates_select on public.id_card_templates
  for select
  using (
    college_id is null
    or public.belongs_to_college(college_id)
  );

create policy id_card_templates_insert on public.id_card_templates
  for insert
  with check (
    case when college_id is null
      then public.is_super_admin()
      else public.is_super_admin() or public.is_college_admin(college_id)
    end
  );

create policy id_card_templates_update on public.id_card_templates
  for update
  using (
    public.is_super_admin()
    or (college_id is not null and public.is_college_admin(college_id))
  )
  with check (
    case when college_id is null
      then public.is_super_admin()
      else public.is_super_admin() or public.is_college_admin(college_id)
    end
  );

create policy id_card_templates_delete on public.id_card_templates
  for delete
  using (
    public.is_super_admin()
    or (college_id is not null and public.is_college_admin(college_id))
  );

-- ---------------------------------------------------------------------------
-- audit_logs: append and read only.
-- ---------------------------------------------------------------------------

create policy audit_logs_insert on public.audit_logs
  for insert
  with check (
    actor_id = auth.uid()
    and (college_id is null or public.belongs_to_college(college_id))
  );

create policy audit_logs_select on public.audit_logs
  for select
  using (
    public.is_super_admin()
    or public.belongs_to_college(college_id)
    or actor_id = auth.uid()
  );

-- No update or delete policy: the log cannot be rewritten through the API.
