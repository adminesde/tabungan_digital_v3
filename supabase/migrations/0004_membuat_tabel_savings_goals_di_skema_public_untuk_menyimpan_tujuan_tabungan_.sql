CREATE TABLE public.savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id TEXT, -- For class-level goals
  type TEXT NOT NULL, -- 'class'
  goal_name TEXT NOT NULL,
  goal_amount NUMERIC NOT NULL,
  target_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

alter table public.savings_goals enable row level security;

create policy "Savings goals are viewable by authenticated users." on savings_goals for select using ( auth.role() = 'authenticated' );

create policy "Admins can insert savings goals." on savings_goals for insert with check ( (select role from public.profiles where id = auth.uid()) = 'admin' );

create policy "Admins can update savings goals." on savings_goals for update using ( (select role from public.profiles where id = auth.uid()) = 'admin' );

create policy "Admins can delete savings goals." on savings_goals for delete using ( (select role from public.profiles where id = auth.uid()) = 'admin' );