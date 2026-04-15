-- Add gender column if it is missing from the original people schema
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
