-- Add new values to the existing ENUM
-- Note: Postgres ALLOWS appending values to ENUMs safely without recreating the type!
ALTER TYPE public.membership_type ADD VALUE IF NOT EXISTS 'seasonal_1';
ALTER TYPE public.membership_type ADD VALUE IF NOT EXISTS 'seasonal_2';

-- Seed the new system settings for Seasonal Boundaries
INSERT INTO public.system_settings (key, value, description)
VALUES (
  'seasonal_periods', 
  '{"season_1": {"start_month": 5, "start_day": 1, "end_month": 9, "end_day": 30}, "season_2": {"start_month": 10, "start_day": 1, "end_month": 4, "end_day": 30}}', 
  'Configures the operational from-to boundaries for Seasonal Memberships'
)
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;
