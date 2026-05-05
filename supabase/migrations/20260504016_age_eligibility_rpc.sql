-- =============================================================================
-- Migration: 20260504016_age_eligibility_rpc
-- Description: Adds helper functions for calculating sport age eligibility
-- =============================================================================

-- 1. Helper function to calculate age based on the reference rule
CREATE OR REPLACE FUNCTION public.calculate_age_on_reference_date(
  p_birth_date date,
  p_evaluation_year integer,
  p_rule public.sport_age_reference_rule DEFAULT 'january_1_of_evaluation_year'
) RETURNS integer AS $$
DECLARE
  v_reference_date date;
  v_age integer;
BEGIN
  -- Determine the reference date based on the rule
  IF p_rule = 'january_1_of_evaluation_year' THEN
    v_reference_date := make_date(p_evaluation_year, 1, 1);
  ELSE
    -- Fallback to current date (safe fallback)
    v_reference_date := current_date;
  END IF;

  -- Calculate the age in full years on the reference date
  v_age := extract(year from age(v_reference_date, p_birth_date))::integer;
  
  RETURN v_age;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Helper function to check if a birth date is eligible
CREATE OR REPLACE FUNCTION public.check_age_eligibility(
  p_birth_date date,
  p_evaluation_year integer,
  p_min_age_years integer,
  p_max_age_years integer,
  p_rule public.sport_age_reference_rule DEFAULT 'january_1_of_evaluation_year'
) RETURNS boolean AS $$
DECLARE
  v_calculated_age integer;
BEGIN
  v_calculated_age := public.calculate_age_on_reference_date(p_birth_date, p_evaluation_year, p_rule);

  IF p_min_age_years IS NOT NULL AND v_calculated_age < p_min_age_years THEN
    RETURN false;
  END IF;

  IF p_max_age_years IS NOT NULL AND v_calculated_age > p_max_age_years THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.calculate_age_on_reference_date IS 'Calculates a persons age on the reference date determined by the sport_age_reference_rule.';
COMMENT ON FUNCTION public.check_age_eligibility IS 'Checks if a person''s birth date falls within the min/max age boundaries for a given evaluation year.';
