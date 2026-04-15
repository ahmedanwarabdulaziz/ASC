-- Make English names optional or remove them
ALTER TABLE public.role_definitions DROP COLUMN name_en;
ALTER TABLE public.role_fields DROP COLUMN name_en;
