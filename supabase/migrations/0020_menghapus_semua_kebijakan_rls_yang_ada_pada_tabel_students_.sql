DROP POLICY IF EXISTS "Teachers can view their class students." ON public.students;
DROP POLICY IF EXISTS "Parents can view their children's data." ON public.students;
DROP POLICY IF EXISTS "Allow anon select for student lookup" ON public.students;