-- Enable required extensions
create extension if not exists "uuid-ossp";

-- 1. Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  first_name text,
  last_name text,
  role text check (role in ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'STAFF')) not null default 'STAFF',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Schools
create table schools (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code text unique not null,
  logo_url text,
  address text,
  contact_email text,
  contact_phone text,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. School Members
create table school_members (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references schools(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text check (role in ('SCHOOL_ADMIN', 'STAFF')) not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(school_id, user_id)
);

-- 4. Academic Sessions
create table academic_sessions (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references schools(id) on delete cascade not null,
  name text not null, -- e.g., '2026-27'
  start_date date,
  end_date date,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(school_id, name)
);

-- 5. Classes
create table classes (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references schools(id) on delete cascade not null,
  name text not null, -- e.g., 'Class 10', 'B.Tech Year 1'
  order_index integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(school_id, name)
);

-- 6. Sections
create table sections (
  id uuid default uuid_generate_v4() primary key,
  class_id uuid references classes(id) on delete cascade not null,
  name text not null, -- e.g., 'A', 'B'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(class_id, name)
);

-- 7. ID Card Templates
create table id_card_templates (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references schools(id) on delete cascade,
  name text not null,
  config jsonb not null default '{}'::jsonb,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Students
create table students (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references schools(id) on delete cascade not null,
  academic_session_id uuid references academic_sessions(id) not null,
  class_id uuid references classes(id) not null,
  section_id uuid references sections(id),
  
  -- Personal
  full_name text not null,
  date_of_birth date,
  gender text check (gender in ('MALE', 'FEMALE', 'OTHER')),
  blood_group text,
  father_name text,
  mother_name text,
  guardian_name text,
  phone text,
  address text,
  
  -- Academic
  admission_number text,
  roll_number text,
  registration_number text,
  course text,
  
  -- Statuses
  status text check (status in ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')) default 'DRAFT' not null,
  card_status text check (card_status in ('PENDING', 'READY_FOR_PRINT', 'PRINTED')) default 'PENDING' not null,
  rejection_reason text,
  
  created_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicates per school, session, and admission number
  unique(school_id, academic_session_id, admission_number)
);

-- 9. Student Photos
create table student_photos (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references students(id) on delete cascade not null,
  storage_path text not null,
  mime_type text,
  file_size integer,
  width integer,
  height integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(student_id)
);

-- 10. Audit Logs
create table audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id),
  school_id uuid references schools(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  details jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS setup to be added in next step

-- === Row Level Security (RLS) Policies ===

alter table profiles enable row level security;
alter table schools enable row level security;
alter table school_members enable row level security;
alter table academic_sessions enable row level security;
alter table classes enable row level security;
alter table sections enable row level security;
alter table id_card_templates enable row level security;
alter table students enable row level security;
alter table student_photos enable row level security;
alter table audit_logs enable row level security;

-- Function to get current user's role
create or replace function get_user_role() returns text as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer;

-- Profiles: Users can read their own profile. Super Admins can read all.
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Super admins can view all profiles" on profiles for all using (get_user_role() = 'SUPER_ADMIN');

-- Schools: Super Admins can do all. Members can view their own school.
create policy "Super admins can manage schools" on schools for all using (get_user_role() = 'SUPER_ADMIN');
create policy "School members can view their school" on schools for select using (
  exists (select 1 from school_members where school_id = schools.id and user_id = auth.uid())
);

-- School Members: Super Admins can manage all. School Admins can manage their school's members.
create policy "Super admins can manage school members" on school_members for all using (get_user_role() = 'SUPER_ADMIN');
create policy "School admins can manage members" on school_members for all using (
  exists (select 1 from school_members sm where sm.school_id = school_members.school_id and sm.user_id = auth.uid() and sm.role = 'SCHOOL_ADMIN')
);
create policy "Staff can view members of their school" on school_members for select using (
  exists (select 1 from school_members sm where sm.school_id = school_members.school_id and sm.user_id = auth.uid())
);

-- Academic Sessions, Classes, Sections, Templates: Super Admins can manage all. School Admins can manage their school. Staff can view.
create policy "Super admins can manage academic data" on academic_sessions for all using (get_user_role() = 'SUPER_ADMIN');
create policy "School admins can manage academic data" on academic_sessions for all using (
  exists (select 1 from school_members sm where sm.school_id = academic_sessions.school_id and sm.user_id = auth.uid() and sm.role = 'SCHOOL_ADMIN')
);
create policy "Staff can view academic data" on academic_sessions for select using (
  exists (select 1 from school_members sm where sm.school_id = academic_sessions.school_id and sm.user_id = auth.uid())
);

-- Repeat for classes
create policy "Super admins can manage classes" on classes for all using (get_user_role() = 'SUPER_ADMIN');
create policy "School admins can manage classes" on classes for all using (
  exists (select 1 from school_members sm where sm.school_id = classes.school_id and sm.user_id = auth.uid() and sm.role = 'SCHOOL_ADMIN')
);
create policy "Staff can view classes" on classes for select using (
  exists (select 1 from school_members sm where sm.school_id = classes.school_id and sm.user_id = auth.uid())
);

-- Sections
create policy "Super admins can manage sections" on sections for all using (get_user_role() = 'SUPER_ADMIN');
create policy "School admins can manage sections" on sections for all using (
  exists (
    select 1 from school_members sm 
    join classes c on c.school_id = sm.school_id 
    where c.id = sections.class_id and sm.user_id = auth.uid() and sm.role = 'SCHOOL_ADMIN'
  )
);
create policy "Staff can view sections" on sections for select using (
  exists (
    select 1 from school_members sm 
    join classes c on c.school_id = sm.school_id 
    where c.id = sections.class_id and sm.user_id = auth.uid()
  )
);

-- Students: Super admins can manage all. School members can manage their school's students.
create policy "Super admins can manage students" on students for all using (get_user_role() = 'SUPER_ADMIN');
create policy "School members can manage students in their school" on students for all using (
  exists (select 1 from school_members sm where sm.school_id = students.school_id and sm.user_id = auth.uid())
);

-- Student Photos: Similar to students
create policy "Super admins can manage student photos" on student_photos for all using (get_user_role() = 'SUPER_ADMIN');
create policy "School members can manage student photos in their school" on student_photos for all using (
  exists (
    select 1 from students s
    join school_members sm on sm.school_id = s.school_id
    where s.id = student_photos.student_id and sm.user_id = auth.uid()
  )
);

-- Trigger to create profile after user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'STAFF');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

