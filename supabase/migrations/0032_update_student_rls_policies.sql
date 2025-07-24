-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Teachers can view their class students" ON public.students;
DROP POLICY IF EXISTS "Parents can view their children's data" ON public.students;
DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
DROP POLICY IF EXISTS "Allow anon select for student lookup" ON public.students;

-- RLS Policies for SELECT
CREATE POLICY "Admins can view all students" ON public.students
FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Teachers can view their own students" ON public.students
FOR SELECT USING (
  teacher_id = auth.uid()
);

CREATE POLICY "Parents can view their own children" ON public.students
FOR SELECT USING (
  parent_id = auth.uid()
);

-- RLS Policies for INSERT
CREATE POLICY "Admins can insert students" ON public.students
FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Teachers can insert students for themselves" ON public.students
FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'teacher' AND teacher_id = auth.uid()
);

-- RLS Policies for UPDATE
CREATE POLICY "Admins can update any student" ON public.students
FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Teachers can update their own students" ON public.students
FOR UPDATE USING (
  teacher_id = auth.uid()
);

-- RLS Policies for DELETE
CREATE POLICY "Admins can delete any student" ON public.students
FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Teachers can delete their own students" ON public.students
FOR DELETE USING (
  teacher_id = auth.uid()
);

-- Policy for anonymous users to lookup students by NISN (for parent registration)
CREATE POLICY "Allow anon select for student lookup" ON public.students
FOR SELECT USING (true);
