-- Phase 1: Person Registry Schema

-- 1. Create the `people` table. Every human in the system starts here.
CREATE TABLE public.people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internal_code TEXT NOT NULL UNIQUE DEFAULT 'P-' || to_char(now(), 'YYMM') || '-' || substr(md5(random()::text), 1, 6),
    national_id TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    second_name TEXT,
    last_name TEXT NOT NULL,
    phone_number TEXT,
    emergency_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for searching people by national ID
CREATE INDEX idx_people_national_id ON public.people(national_id);

-- 2. Create `family_links` to handle relationships before full memberships
CREATE TYPE relation_type AS ENUM ('wife', 'husband', 'son', 'daughter', 'father', 'mother');

CREATE TABLE public.family_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    main_person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    dependent_person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    relation relation_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(main_person_id, dependent_person_id)
);

-- 3. System users linking `auth.users` to `people`
-- A person can optionally have an auth.users record if they're allowed to login.
CREATE TABLE public.system_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(person_id)
);

-- RLS setup (Base secure default)
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;

-- Note: We will add specific RLS policies in the Role-Based Access Control phase.
