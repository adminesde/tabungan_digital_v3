CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  student_id TEXT UNIQUE NOT NULL, -- NISN
  parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Link to parent profile
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

alter table public.students enable row level security;

create policy "Students are viewable by authenticated users." on students for select using ( auth.role() = 'authenticated' );

create policy "Teachers can insert students." on students for insert with check ( (select role from public.profiles where id = auth.uid()) = 'teacher' OR (select role from public.profiles where id = auth.uid()) = 'admin' );

create policy "Teachers can update their students." on students for update using ( (select role from public.profiles where id = auth.uid()) = 'teacher' AND class = (select class from public.profiles where id = auth.uid()) OR (select role from public.profiles where id = auth.uid()) = 'admin' );

create policy "Teachers can delete their students." on students for delete using ( (select role from public.profiles where id = auth.uid()) = 'teacher' AND class = (select class from public.profiles where id = auth.uid()) OR (select role from public.profiles where id = auth.uid()) = 'admin' );

create policy "Parents can view their children's data." on students for select using ( parent_id = auth.uid() );