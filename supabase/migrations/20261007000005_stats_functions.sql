-- Aggregate counts for dashboards. Security INVOKER on purpose: the inner
-- queries run under the caller's RLS, so asking about another college's
-- numbers returns zeroes instead of leaking them, and no dashboard has to pull
-- thousands of student rows to count them.

create or replace function public.college_stats(p_college_id uuid)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'students', (
      select count(*) from public.students s
      where s.college_id = p_college_id and not s.is_archived
    ),
    'photos_complete', (
      select count(*) from public.student_photos sp
      where sp.college_id = p_college_id
    ),
    'approved', (
      select count(*) from public.students s
      where s.college_id = p_college_id and not s.is_archived
        and s.status = 'APPROVED'
    ),
    'awaiting_review', (
      select count(*) from public.students s
      where s.college_id = p_college_id and not s.is_archived
        and s.status in ('SUBMITTED', 'UNDER_REVIEW')
    ),
    'cards_pending', (
      select count(*) from public.students s
      where s.college_id = p_college_id and not s.is_archived
        and s.card_status = 'PENDING'
    ),
    'cards_printed', (
      select count(*) from public.students s
      where s.college_id = p_college_id and not s.is_archived
        and s.card_status = 'PRINTED'
    ),
    'classes', (
      select count(*) from public.classes c where c.college_id = p_college_id
    ),
    'sessions', (
      select count(*) from public.academic_sessions a
      where a.college_id = p_college_id and a.is_active
    ),
    'staff', (
      select count(*) from public.college_members m
      where m.college_id = p_college_id and m.status = 'ACTIVE'
    )
  );
$$;

create or replace function public.platform_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when public.is_super_admin() then jsonb_build_object(
    'colleges', (select count(*) from public.colleges),
    'colleges_active', (select count(*) from public.colleges where status = 'ACTIVE'),
    'students', (select count(*) from public.students where not is_archived),
    'college_users', (
      select count(distinct user_id) from public.college_members where status = 'ACTIVE'
    ),
    'cards_printed', (
      select count(*) from public.students where card_status = 'PRINTED' and not is_archived
    ),
    'photos_missing', (
      select count(*) from public.students s
      where not s.is_archived
        and not exists (select 1 from public.student_photos sp where sp.student_id = s.id)
    )
  ) else '{}'::jsonb end;
$$;

alter function public.college_stats(uuid) owner to postgres;
alter function public.platform_stats() owner to postgres;

revoke all on function public.platform_stats() from public;
grant execute on function public.platform_stats() to authenticated;
grant execute on function public.college_stats(uuid) to authenticated;
