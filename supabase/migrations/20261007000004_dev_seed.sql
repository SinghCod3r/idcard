-- ===========================================================================
-- DEVELOPMENT SEED ONLY.  Do not run this against a production project.
--
-- Every credential below is a throwaway, clearly-named *.test login. Replace
-- them with real accounts through the Super Admin invitation flow, and delete
-- these rows before any public deployment.
-- ===========================================================================

create extension if not exists "pgcrypto" with schema "extensions";

-- Inserts a confirmed auth user if missing and returns its id. The
-- handle_new_user trigger creates the matching COLLEGE_USER profile.
create or replace function public.seed_dev_user(p_email text, p_name text, p_password text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where email = p_email;

  if v_id is null then
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change, raw_user_meta_data, raw_app_meta_data, created_at, updated_at
    )
    values (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      p_email,
      extensions.crypt(p_password, extensions.gen_salt('bf')),
      now(),
      jsonb_build_object('name', p_name),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      now(),
      now()
    )
    returning id into v_id;

    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
    )
    values (
      gen_random_uuid(),
      v_id,
      v_id::text,
      'email',
      jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true),
      now(),
      now(),
      now()
    )
    on conflict (provider_id, provider) do nothing;
  end if;

  update public.profiles set name = p_name where id = v_id;
  return v_id;
end;
$$;

-- Without this, any signed-in user could mint accounts through PostgREST.
revoke execute on function public.seed_dev_user(text, text, text) from public, anon, authenticated;

-- --------------------------------------------------------------------------
-- Super Admin. Signing up through the app never grants this; it is set here
-- deliberately, from a direct database session.
-- --------------------------------------------------------------------------

do $$
declare
  v_super uuid := public.seed_dev_user('superadmin@idcard.test', 'Platform Owner', 'Dev-Only-2026!');
begin
  update public.profiles set role = 'SUPER_ADMIN' where id = v_super;
end;
$$;

-- --------------------------------------------------------------------------
-- Colleges. Re-running this file does not duplicate them.
-- --------------------------------------------------------------------------

insert into public.colleges (name, code, address, contact_name, contact_email, phone, status)
values
  ('ABC College', 'ABC', '1 Museum Road, Pune', 'Principal Office', 'office@abc.test', '+91 00000 00000', 'ACTIVE'),
  ('XYZ College', 'XYZ', '2 Lake View Road, Nashik', 'Principal Office', 'office@xyz.test', '+91 00000 00001', 'ACTIVE'),
  ('PQR College', 'PQR', '3 Hill Street, Goa', 'Principal Office', 'office@pqr.test', '+91 00000 00002', 'INACTIVE')
on conflict (code) do nothing;

-- --------------------------------------------------------------------------
-- College staff, each bound to exactly one college.
-- --------------------------------------------------------------------------

do $$
declare
  v_abc uuid := (select id from public.colleges where code = 'ABC');
  v_xyz uuid := (select id from public.colleges where code = 'XYZ');
  v_rahul uuid := public.seed_dev_user('rahul@idcard.test', 'Rahul Kumar', 'Dev-Only-2026!');
  v_meera uuid := public.seed_dev_user('meera@idcard.test', 'Meera Shah', 'Dev-Only-2026!');
  v_xyzadmin uuid := public.seed_dev_user('xyzadmin@idcard.test', 'Arjun Nair', 'Dev-Only-2026!');
begin
  insert into public.college_members (college_id, user_id, role)
  values
    (v_abc, v_rahul, 'COLLEGE_ADMIN'),
    (v_abc, v_meera, 'COLLEGE_STAFF'),
    (v_xyz, v_xyzadmin, 'COLLEGE_ADMIN')
  on conflict (college_id, user_id) do nothing;
end;
$$;

-- --------------------------------------------------------------------------
-- Academic structure per college, deliberately different shapes: ABC is a
-- school tree, XYZ is an engineering tree. Nothing here is hard-coded in the app.
-- --------------------------------------------------------------------------

insert into public.academic_sessions (college_id, name, start_date, end_date, is_active)
select c.id, s.name, s.start_date, s.end_date, s.is_active
from public.colleges c
cross join (values
  ('2026-27', date '2026-06-01', date '2027-05-31', true),
  ('2025-26', date '2025-06-01', date '2026-05-31', false)
) as s(name, start_date, end_date, is_active)
where c.code in ('ABC', 'XYZ')
on conflict (college_id, name) do nothing;

insert into public.classes (college_id, name, order_index)
select c.id, k.name, k.order_index
from public.colleges c
cross join (values
  ('ABC', 'Class 10', 1),
  ('ABC', 'Class 11', 2),
  ('XYZ', 'B.Tech CSE 1st Year', 1),
  ('XYZ', 'B.Tech CSE 2nd Year', 2)
) as k(college_code, name, order_index)
where c.code = k.college_code
on conflict (college_id, name) do nothing;

insert into public.sections (class_id, name)
select cl.id, x.name
from public.classes cl
cross join (values ('A'), ('B'), ('C')) as x(name)
where cl.college_id = (select id from public.colleges where code = 'ABC')
  and cl.name in ('Class 10', 'Class 11')
on conflict (class_id, name) do nothing;

insert into public.sections (class_id, name)
select cl.id, x.name
from public.classes cl
cross join (values ('A'), ('B')) as x(name)
where cl.college_id = (select id from public.colleges where code = 'XYZ')
on conflict (class_id, name) do nothing;

-- --------------------------------------------------------------------------
-- Sample students across both colleges, so cross-tenant tests have real rows.
-- --------------------------------------------------------------------------

do $$
declare
  v_abc uuid := (select id from public.colleges where code = 'ABC');
  v_xyz uuid := (select id from public.colleges where code = 'XYZ');
  v_abc_session uuid := (select id from public.academic_sessions where college_id = v_abc and name = '2026-27');
  v_xyz_session uuid := (select id from public.academic_sessions where college_id = v_xyz and name = '2026-27');
  v_class10 uuid := (select id from public.classes where college_id = v_abc and name = 'Class 10');
  v_class11 uuid := (select id from public.classes where college_id = v_abc and name = 'Class 11');
  v_cse1 uuid := (select id from public.classes where college_id = v_xyz and name = 'B.Tech CSE 1st Year');
  v_rahul uuid := (select id from public.profiles where email = 'rahul@idcard.test');
  v_meera uuid := (select id from public.profiles where email = 'meera@idcard.test');
begin
  insert into public.students
    (college_id, academic_session_id, class_id, section_id, full_name, admission_number,
     roll_number, date_of_birth, gender, father_name, phone, status, card_status, created_by)
  values
    (v_abc, v_abc_session, v_class10,
     (select id from public.sections where class_id = v_class10 and name = 'A'),
     'Aarav Sharma', 'ABC-2026-001', '10', date '2011-04-12', 'MALE', 'Rakesh Sharma', '+91 90000 00001',
     'APPROVED', 'READY_FOR_PRINT', v_rahul),

    (v_abc, v_abc_session, v_class10,
     (select id from public.sections where class_id = v_class10 and name = 'B'),
     'Diya Patel', 'ABC-2026-002', '11', date '2011-09-30', 'FEMALE', 'Nilesh Patel', '+91 90000 00002',
     'SUBMITTED', 'PENDING', v_meera),

    (v_abc, v_abc_session, v_class11,
     (select id from public.sections where class_id = v_class11 and name = 'A'),
     'Kabir Singh', 'ABC-2026-003', '08', date '2010-01-21', 'MALE', 'Harpreet Singh', '+91 90000 00003',
     'DRAFT', 'PENDING', v_meera),

    (v_xyz, v_xyz_session, v_cse1,
     (select id from public.sections where class_id = v_cse1 and name = 'A'),
     'Isha Verma', 'XYZ-2026-001', 'CS-04', date '2008-07-07', 'FEMALE', 'Sanjay Verma', '+91 90000 00010',
     'APPROVED', 'PRINTED', null),

    (v_xyz, v_xyz_session, v_cse1,
     (select id from public.sections where class_id = v_cse1 and name = 'B'),
     'Rohan Das', 'XYZ-2026-002', 'CS-05', date '2008-02-19', 'MALE', 'Pranab Das', '+91 90000 00011',
     'UNDER_REVIEW', 'PENDING', null);
end;
$$;

-- --------------------------------------------------------------------------
-- A platform-wide ID card template, owned by no college.
-- --------------------------------------------------------------------------

insert into public.id_card_templates (college_id, name, config)
select null, 'Default portrait card',
  jsonb_build_object(
    'size', jsonb_build_object('widthMm', 85.6, 'heightMm', 54),
    'showPhoto', true,
    'showAdmissionNumber', true,
    'theme', 'neutral'
  )
where not exists (select 1 from public.id_card_templates where name = 'Default portrait card');
