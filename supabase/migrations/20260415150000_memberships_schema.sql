-- Enums for Memberships
CREATE TYPE public.membership_type AS ENUM ('working', 'sports', 'affiliate');
CREATE TYPE public.membership_status AS ENUM ('active', 'suspended', 'cancelled');
CREATE TYPE public.relationship_type AS ENUM ('principal', 'wife', 'husband', 'son', 'daughter');
CREATE TYPE public.card_status AS ENUM ('active', 'printing', 'suspended', 'lost');

-- 1. System Settings (For Club Variables like Age Limit)
CREATE TABLE public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Core Memberships Table (The Contract)
CREATE TABLE public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_number TEXT UNIQUE NOT NULL,
    main_person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE RESTRICT,
    type membership_type NOT NULL DEFAULT 'working',
    status membership_status NOT NULL DEFAULT 'active',
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Membership Members Junction (The Family attached to the Contract)
CREATE TABLE public.membership_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE RESTRICT,
    relationship relationship_type NOT NULL,
    card_status card_status NOT NULL DEFAULT 'active',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(membership_id, person_id) 
);

-- We need birth_date efficiently queryable to flag those crossing the threshold
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Initial Seed for Settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
('membership_sequence', '{"next_number": 1, "prefix": "2026-"}', 'Tracks the auto-generated membership number allocation'),
('age_limits', '{"minor_max_age": 21}', 'The legal age limit where children dependants are flagged for independent memberships');

-- RLS Bypasses for Development (Will secure in Phase 5)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users full access to system_settings" ON public.system_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated users full access to memberships" ON public.memberships FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all authenticated users full access to membership_members" ON public.membership_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
