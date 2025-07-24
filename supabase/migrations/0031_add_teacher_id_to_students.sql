ALTER TABLE public.students
ADD COLUMN teacher_id UUID REFERENCES public.profiles(id);
