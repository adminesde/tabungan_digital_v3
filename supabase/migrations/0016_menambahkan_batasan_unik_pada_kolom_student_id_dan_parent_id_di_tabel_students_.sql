ALTER TABLE public.students
ADD CONSTRAINT unique_student_id UNIQUE (student_id);

ALTER TABLE public.students
ADD CONSTRAINT unique_parent_id UNIQUE (parent_id);