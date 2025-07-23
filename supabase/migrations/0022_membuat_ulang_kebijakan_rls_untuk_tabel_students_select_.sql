-- Policy for Teachers to view their class students
CREATE POLICY "Teachers can view their class students" ON public.students
FOR SELECT USING (
  class = (SELECT profiles.class FROM profiles WHERE profiles.id = auth.uid())
);

-- Policy for Parents to view their children's data
CREATE POLICY "Parents can view their children's data" ON public.students
FOR SELECT USING (
  parent_id = auth.uid()
);

-- Policy for Admins to view all students
CREATE POLICY "Admins can view all students" ON public.students
FOR SELECT USING (
  (SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = 'admin'
);

-- Policy for anonymous users to lookup students by NISN (for parent registration)
CREATE POLICY "Allow anon select for student lookup" ON public.students
FOR SELECT USING (true);