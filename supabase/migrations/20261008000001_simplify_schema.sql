-- 1. Drop old triggers that reference dropped columns
DROP TRIGGER IF EXISTS students_academic_consistency ON public.students;
DROP TRIGGER IF EXISTS students_workflow_permissions ON public.students;
DROP FUNCTION IF EXISTS public.enforce_student_academic_consistency();
DROP FUNCTION IF EXISTS public.enforce_student_workflow_permissions();

-- 2. Modify students table
ALTER TABLE public.students 
  DROP COLUMN IF EXISTS academic_session_id,
  DROP COLUMN IF EXISTS section_id,
  DROP COLUMN IF EXISTS date_of_birth,
  DROP COLUMN IF EXISTS gender,
  DROP COLUMN IF EXISTS blood_group,
  DROP COLUMN IF EXISTS father_name,
  DROP COLUMN IF EXISTS mother_name,
  DROP COLUMN IF EXISTS guardian_name,
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS admission_number,
  DROP COLUMN IF EXISTS registration_number,
  DROP COLUMN IF EXISTS course,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS card_status,
  DROP COLUMN IF EXISTS rejection_reason,
  DROP COLUMN IF EXISTS is_archived;

-- 3. Drop sections and academic_sessions
-- Cascades will drop the tables, their constraints, their triggers, and their policies
DROP TABLE IF EXISTS public.sections CASCADE;
DROP TABLE IF EXISTS public.academic_sessions CASCADE;
DROP FUNCTION IF EXISTS public.section_college(uuid);

-- 4. Update Classes policies
-- College User should be able to create classes now (not just Admin)
DROP POLICY IF EXISTS classes_insert ON public.classes;
DROP POLICY IF EXISTS classes_update ON public.classes;
DROP POLICY IF EXISTS classes_delete ON public.classes;

CREATE POLICY classes_insert ON public.classes
  FOR INSERT
  WITH CHECK (public.belongs_to_college(college_id));

CREATE POLICY classes_update ON public.classes
  FOR UPDATE
  USING (public.belongs_to_college(college_id))
  WITH CHECK (public.belongs_to_college(college_id));

CREATE POLICY classes_delete ON public.classes
  FOR DELETE
  USING (public.belongs_to_college(college_id));

-- 5. Update Students policies
-- College User should be able to delete students as well?
-- The new spec doesn't specify, but usually they should have full control over their students
DROP POLICY IF EXISTS students_delete ON public.students;
CREATE POLICY students_delete ON public.students
  FOR DELETE
  USING (public.belongs_to_college(college_id));

