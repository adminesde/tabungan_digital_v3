-- Menonaktifkan kebijakan yang terlalu luas jika ada
DROP POLICY IF EXISTS "Savings goals are viewable by authenticated users." ON public.savings_goals;

-- Kebijakan untuk Admin: Dapat melihat semua tujuan tabungan
CREATE POLICY "Admins can view all savings goals" ON public.savings_goals
FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Kebijakan untuk Guru: Dapat melihat tujuan tabungan untuk kelas mereka
CREATE POLICY "Teachers can view their class savings goals" ON public.savings_goals
FOR SELECT USING (
  (SELECT class FROM public.profiles WHERE id = auth.uid()) = class_id
);

-- Kebijakan untuk Orang Tua: Dapat melihat tujuan tabungan untuk kelas anak-anak mereka
CREATE POLICY "Parents can view their children's class savings goals" ON public.savings_goals
FOR SELECT USING (
  class_id IN (SELECT class FROM public.students WHERE parent_id = auth.uid())
);