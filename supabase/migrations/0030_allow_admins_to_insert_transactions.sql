CREATE POLICY "Admins can insert transactions" ON public.transactions
FOR INSERT TO authenticated
WITH CHECK ( ( SELECT profiles.role FROM public.profiles WHERE profiles.id = auth.uid() ) = 'admin' );