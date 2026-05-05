-- =============================================================================
-- Migration: 20260504018_player_enrollment
-- Phase 4D: Player Enrollment Schema
-- =============================================================================

-- 1. Enums
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sport_player_status') THEN
    CREATE TYPE public.sport_player_status AS ENUM ('active', 'suspended', 'ended');
  END IF;
END $$;

-- 2. Tables

CREATE TABLE IF NOT EXISTS public.sport_players (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete restrict,
  sport_id uuid not null references public.sports(id) on delete restrict,
  current_level_id uuid references public.sport_levels(id) on delete set null,
  status public.sport_player_status not null default 'active',
  joined_at date not null default current_date,
  ended_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(person_id, sport_id)
);

CREATE TABLE IF NOT EXISTS public.player_level_history (
  id uuid primary key default gen_random_uuid(),
  sport_player_id uuid not null references public.sport_players(id) on delete cascade,
  sport_id uuid not null references public.sports(id) on delete cascade,
  from_level_id uuid references public.sport_levels(id) on delete set null,
  to_level_id uuid not null references public.sport_levels(id) on delete cascade,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id) on delete set null,
  reason text,
  notes text
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_sport_players_person_id ON public.sport_players(person_id);
CREATE INDEX IF NOT EXISTS idx_sport_players_sport_id ON public.sport_players(sport_id);
CREATE INDEX IF NOT EXISTS idx_player_level_history_sport_player_id ON public.player_level_history(sport_player_id);

-- 4. RLS
ALTER TABLE public.sport_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_level_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read sport_players" ON public.sport_players;
CREATE POLICY "Allow authenticated read sport_players" ON public.sport_players FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read player_level_history" ON public.player_level_history;
CREATE POLICY "Allow authenticated read player_level_history" ON public.player_level_history FOR SELECT TO authenticated USING (true);

-- 5. Permissions
INSERT INTO public.system_permissions (code, name_ar, name_en, description)
VALUES 
  ('players.view', 'عرض اللاعبين', 'Players View', 'View players list'),
  ('players.manage', 'إدارة اللاعبين', 'Players Manage', 'Enroll and manage sport players')
ON CONFLICT (code) DO NOTHING;

-- Map to system_admin
INSERT INTO public.system_role_permissions (role_id, permission_code)
SELECT id, permission_code
FROM public.role_definitions
CROSS JOIN (
  VALUES 
    ('players.view'),
    ('players.manage')
) AS perms(permission_code)
WHERE code = 'system_admin'
ON CONFLICT DO NOTHING;
