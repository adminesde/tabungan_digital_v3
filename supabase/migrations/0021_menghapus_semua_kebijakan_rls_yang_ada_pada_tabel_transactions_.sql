DROP POLICY IF EXISTS "Teachers can insert transactions for their students." ON public.transactions;
DROP POLICY IF EXISTS "Parents can view their children's transactions." ON public.transactions;
DROP POLICY IF EXISTS "Admins can delete all transactions." ON public.transactions;
DROP POLICY IF EXISTS "Teachers can view their class transactions." ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions." ON public.transactions;