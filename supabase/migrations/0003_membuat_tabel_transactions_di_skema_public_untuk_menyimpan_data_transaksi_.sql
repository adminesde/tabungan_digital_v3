CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'deposit' or 'withdrawal'
  amount NUMERIC NOT NULL,
  description TEXT,
  performed_by TEXT NOT NULL, -- Name of the user who performed the transaction
  performed_by_role TEXT NOT NULL, -- Role of the user who performed the transaction
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  balance NUMERIC NOT NULL -- Student's balance after this transaction
);

alter table public.transactions enable row level security;

create policy "Transactions are viewable by authenticated users." on transactions for select using ( auth.role() = 'authenticated' );

create policy "Teachers can insert transactions for their students." on transactions for insert with check ( (select role from public.profiles where id = auth.uid()) = 'teacher' AND student_id IN (select id from public.students where class = (select class from public.profiles where id = auth.uid())) OR (select role from public.profiles where id = auth.uid()) = 'admin' );

create policy "Parents can view their children's transactions." on transactions for select using ( student_id IN (select id from public.students where parent_id = auth.uid()) );

create policy "Admins can delete all transactions." on transactions for delete using ( (select role from public.profiles where id = auth.uid()) = 'admin' );