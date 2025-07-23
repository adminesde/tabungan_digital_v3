-- Policy for Teachers to insert transactions for their students
CREATE POLICY "Teachers can insert transactions for their students" ON public.transactions
FOR INSERT WITH CHECK (
  student_id IN (SELECT students.id FROM students WHERE students.class = (SELECT profiles.class FROM profiles WHERE profiles.id = auth.uid()))
);

-- Policy for Teachers to view their class transactions
CREATE POLICY "Teachers can view their class transactions" ON public.transactions
FOR SELECT USING (
  student_id IN (SELECT students.id FROM students WHERE students.class = (SELECT profiles.class FROM profiles WHERE profiles.id = auth.uid()))
);

-- Policy for Parents to view their children's transactions
CREATE POLICY "Parents can view their children's transactions" ON public.transactions
FOR SELECT USING (
  student_id IN (SELECT students.id FROM students WHERE students.parent_id = auth.uid())
);

-- Policy for Admins to view all transactions
CREATE POLICY "Admins can view all transactions" ON public.transactions
FOR SELECT USING (
  (SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = 'admin'
);

-- Policy for Admins to delete all transactions (use with caution)
CREATE POLICY "Admins can delete all transactions" ON public.transactions
FOR DELETE USING (
  (SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = 'admin'
);