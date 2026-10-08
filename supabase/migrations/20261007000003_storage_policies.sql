-- Private storage for student photographs.
-- Object layout is <college_uuid>/<student_uuid>.<ext>; the first segment is the
-- tenant key every policy below checks, so rewriting a path cannot reach another
-- college's photo. The bucket is never public and no public URL is minted.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-photos',
  'student-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];


-- Reads back the object metadata for a college the caller belongs to. Short
-- signed URLs are minted from the server after the same check, so this policy is
-- what actually stops a cross-college download.
create policy "student photos readable by owning college"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'student-photos'
  and public.belongs_to_college((storage.foldername(name))[1]::uuid)
);

create policy "student photos written by owning college"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'student-photos'
  and public.belongs_to_college((storage.foldername(name))[1]::uuid)
);

-- Replacing a photo keeps the same college prefix; a path that would move the
-- object out of the caller's college fails WITH CHECK.
create policy "student photos updated by owning college"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'student-photos'
  and public.belongs_to_college((storage.foldername(name))[1]::uuid)
)
with check (
  bucket_id = 'student-photos'
  and public.belongs_to_college((storage.foldername(name))[1]::uuid)
);

create policy "student photos deleted by owning college"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'student-photos'
  and public.belongs_to_college((storage.foldername(name))[1]::uuid)
);

-- Anonymous access is denied by the absence of any policy for the anon role.
