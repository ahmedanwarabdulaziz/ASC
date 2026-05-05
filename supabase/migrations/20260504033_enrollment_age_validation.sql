-- =============================================================================
-- Migration: 20260504033_enrollment_age_validation
-- Fixes: Training group enrollment was not enforcing the age-group min/max
--        age limits defined in sport_age_groups.
-- =============================================================================

-- 1. Helper: Extract birth date from Egyptian 14-digit national ID
--    Format: CYYMMDD... where C = century digit (2 = 1900s, 3 = 2000s)
CREATE OR REPLACE FUNCTION public.birth_date_from_national_id(p_national_id text)
RETURNS date AS $$
DECLARE
  v_century_digit integer;
  v_year_part text;
  v_month_part text;
  v_day_part text;
  v_full_year integer;
  v_result date;
BEGIN
  -- National ID must be exactly 14 digits
  IF p_national_id IS NULL OR length(p_national_id) != 14 THEN
    RETURN NULL;
  END IF;

  -- Only proceed if it looks numeric
  IF p_national_id !~ '^\d{14}$' THEN
    RETURN NULL;
  END IF;

  v_century_digit := substr(p_national_id, 1, 1)::integer;
  v_year_part     := substr(p_national_id, 2, 2);
  v_month_part    := substr(p_national_id, 4, 2);
  v_day_part      := substr(p_national_id, 6, 2);

  -- Determine full year from century digit
  IF v_century_digit = 2 THEN
    v_full_year := 1900 + v_year_part::integer;
  ELSIF v_century_digit = 3 THEN
    v_full_year := 2000 + v_year_part::integer;
  ELSE
    -- Unknown century digit — cannot determine birth date
    RETURN NULL;
  END IF;

  -- Attempt to construct a valid date; return NULL on invalid combos
  BEGIN
    v_result := make_date(v_full_year, v_month_part::integer, v_day_part::integer);
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.birth_date_from_national_id IS
  'Extracts the date of birth from a 14-digit Egyptian national ID. Returns NULL if the ID is invalid or the birth date cannot be determined.';


-- 2. Rewrite check_enrollment_eligibility to also enforce age-group bounds
CREATE OR REPLACE FUNCTION public.check_enrollment_eligibility(p_person_id uuid, p_training_group_id uuid)
RETURNS boolean AS $$
DECLARE
  v_sector_type  public.sport_sector_type;
  v_is_member    boolean;
  v_age_group_id uuid;
  v_min_age      integer;
  v_max_age      integer;
  v_age_rule     public.sport_age_reference_rule;
  v_national_id  text;
  v_birth_date   date;
  v_eval_year    integer;
BEGIN
  -- ── 1. Fetch group details ──────────────────────────────────────────────
  SELECT ss.sector_type, tg.age_group_id
    INTO v_sector_type, v_age_group_id
    FROM public.training_groups tg
    JOIN public.sport_sectors ss ON ss.id = tg.sector_id
   WHERE tg.id = p_training_group_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Training group not found';
  END IF;

  -- ── 2. Sector / membership check (original logic) ──────────────────────
  IF v_sector_type = 'competition' THEN
    v_is_member := public.person_has_active_membership(p_person_id);
    IF NOT v_is_member THEN
      RETURN false;
    END IF;
  END IF;
  -- Practice sector: no membership needed → continue to age check

  -- ── 3. Age-group enforcement ───────────────────────────────────────────
  IF v_age_group_id IS NOT NULL THEN
    -- Fetch age boundaries
    SELECT ag.min_age_years, ag.max_age_years, ag.age_reference_rule
      INTO v_min_age, v_max_age, v_age_rule
      FROM public.sport_age_groups ag
     WHERE ag.id = v_age_group_id AND ag.is_active = true;

    -- If the age group exists and has at least one bound, validate
    IF FOUND AND (v_min_age IS NOT NULL OR v_max_age IS NOT NULL) THEN
      -- Get person's national ID to derive birth date
      SELECT p.national_id INTO v_national_id
        FROM public.people p
       WHERE p.id = p_person_id;

      v_birth_date := public.birth_date_from_national_id(v_national_id);

      IF v_birth_date IS NULL THEN
        -- Cannot determine birth date → block enrollment for safety
        RETURN false;
      END IF;

      -- Use the current year as the evaluation year
      v_eval_year := extract(year FROM current_date)::integer;

      IF NOT public.check_age_eligibility(v_birth_date, v_eval_year, v_min_age, v_max_age, v_age_rule) THEN
        RETURN false;
      END IF;
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_enrollment_eligibility IS
  'Checks whether a person is eligible to enroll in a training group. Validates: (1) competition-sector membership requirement, (2) age-group min/max bounds using the sport age reference rule.';
