-- Phase 2: Role Assignment Engine

-- 1. Role definitions (e.g. Employee, Coach, Working Member)
CREATE TYPE role_category AS ENUM ('membership', 'staff', 'activity', 'access');

CREATE TABLE public.role_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    category role_category NOT NULL,
    allows_system_login BOOLEAN DEFAULT false,
    public_visibility BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Role Fields (Dynamic Fields per role, e.g. "Sport" for a Coach)
CREATE TYPE field_type AS ENUM ('text', 'number', 'date', 'boolean', 'select');

CREATE TABLE public.role_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.role_definitions(id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    field_type field_type NOT NULL,
    is_required BOOLEAN DEFAULT false,
    list_options JSONB, -- For 'select' fields, an array of options
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(role_id, name_en)
);

-- 3. Person Roles (Linking a person to a role instance)
CREATE TYPE role_status AS ENUM ('active', 'inactive', 'suspended');

CREATE TABLE public.person_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.role_definitions(id) ON DELETE RESTRICT,
    status role_status DEFAULT 'active',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Person Role Values (Answers to the Role Fields)
CREATE TABLE public.person_role_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_role_id UUID NOT NULL REFERENCES public.person_roles(id) ON DELETE CASCADE,
    role_field_id UUID NOT NULL REFERENCES public.role_fields(id) ON DELETE RESTRICT,
    value_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(person_role_id, role_field_id)
);

-- RLS Setup
ALTER TABLE public.role_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_role_values ENABLE ROW LEVEL SECURITY;
