-- Add start_date column to project_tasks table
ALTER TABLE public.project_tasks 
ADD COLUMN start_date timestamp with time zone DEFAULT now();