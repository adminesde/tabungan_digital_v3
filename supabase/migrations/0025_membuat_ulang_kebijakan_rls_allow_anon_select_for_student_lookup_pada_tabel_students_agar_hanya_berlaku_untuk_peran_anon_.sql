CREATE POLICY "Allow anon select for student lookup" ON public.students
FOR SELECT TO anon USING (true);