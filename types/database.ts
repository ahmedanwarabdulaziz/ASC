/**
 * Supabase Database Types
 *
 * This file is manually maintained for Phase 1 & 2 security/core tables.
 * Once the full schema is stable, replace with auto-generated types:
 *
 *   npx supabase gen types typescript --project-id <project-id> > types/database.ts
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export type UUID = string;
export type ISOTimestamp = string; // ISO 8601 timestamptz as returned by Supabase

// ---------------------------------------------------------------------------
// Phase 1: Security schema types
// ---------------------------------------------------------------------------

export type RoleDefinition = {
  id: UUID;
  code: string;
  name_ar: string;
  name_en: string | null;
  description: string | null;
  is_active: boolean;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
};

export type SystemPermission = {
  code: string;
  name_ar: string;
  name_en: string | null;
  description: string | null;
  created_at: ISOTimestamp;
};

export type SystemRolePermission = {
  role_id: UUID;
  permission_code: string;
};

export type SystemUser = {
  id: UUID;
  auth_user_id: UUID;
  person_id: UUID | null;
  is_active: boolean;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
};

export type PersonRole = {
  id: UUID;
  person_id: UUID;
  role_id: UUID;
  is_active: boolean;
  granted_at: ISOTimestamp;
  ended_at: ISOTimestamp | null;
  granted_by: UUID | null;
  ended_by: UUID | null;
};

export type AuditLog = {
  id: UUID;
  actor_user_id: UUID | null;
  action: string;
  entity_type: string;
  entity_id: UUID | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: ISOTimestamp;
};

// ---------------------------------------------------------------------------
// Phase 2: People and Memberships types
// ---------------------------------------------------------------------------

export type Person = {
  id: UUID;
  internal_code: string;
  national_id: string;
  first_name: string;
  second_name: string;
  third_name: string;
  last_name: string;
  phone_number: string | null;
  emergency_contact: string | null;
  archived_at: ISOTimestamp | null;
  archived_by: UUID | null;
  archive_reason: string | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
};

export type FamilyLink = {
  id: UUID;
  person_id: UUID;
  related_person_id: UUID;
  relation_type: string;
  is_active: boolean;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
};

export type Membership = {
  id: UUID;
  type: string; // 'working', 'sports'
  main_person_id: UUID;
  status: string; // 'active', 'suspended', 'cancelled'
  archived_at: ISOTimestamp | null;
  archived_by: UUID | null;
  archive_reason: string | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
};

export type MembershipMember = {
  id: UUID;
  membership_id: UUID;
  person_id: UUID;
  relation_type: string;
  status: string; // 'active', 'ended', 'separated'
  ended_at: ISOTimestamp | null;
  ended_by: UUID | null;
  end_reason: string | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
};

export type MembershipNumberRegistry = {
  id: UUID;
  membership_number: string;
  number_type: string; // 'working', 'sports', 'dependent'
  person_id: UUID;
  membership_id: UUID;
  membership_member_id: UUID | null;
  is_current: boolean;
  reason: string | null;
  ended_at: ISOTimestamp | null;
  created_at: ISOTimestamp;
};

export type MembershipNumberSequence = {
  id: UUID;
  base_membership_number: string;
  next_dependent_suffix: number;
  updated_at: ISOTimestamp;
};

export type DependentConversionRule = {
  id: UUID;
  relation_type: string;
  min_age_years: number | null;
  min_membership_days: number | null;
  requires_admin_approval: boolean;
  requires_board_approval: boolean;
  requires_payment: boolean;
  is_separation_allowed: boolean;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
};

export type MembershipSeparationRequest = {
  id: UUID;
  membership_member_id: UUID;
  requested_by: UUID | null;
  status: string;
  admin_approved_by: UUID | null;
  admin_approved_at: ISOTimestamp | null;
  board_approved_by: UUID | null;
  board_approved_at: ISOTimestamp | null;
  board_decision_number: string | null;
  board_meeting_date: string | null;
  payment_confirmed_by: UUID | null;
  payment_confirmed_at: ISOTimestamp | null;
  new_working_membership_id: UUID | null;
  notes: string | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
};

// ---------------------------------------------------------------------------
// Phase 3: Staff types
// ---------------------------------------------------------------------------

export type StaffCategory = {
  id: UUID;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
};

export type StaffSubcategory = {
  id: UUID;
  category_id: UUID;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
};

export type StaffGroup = {
  id: UUID;
  name: string;
  description: string | null;
  role_id: UUID | null;
  is_active: boolean;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
};

export type StaffJob = {
  id: UUID;
  category_id: UUID;
  subcategory_id: UUID | null;
  default_group_id: UUID | null;
  name: string;
  description: string | null;
  is_training_sector: boolean;
  is_training_commissionable: boolean;
  account_policy: 'none' | 'optional' | 'required';
  is_active: boolean;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
};

export type StaffMember = {
  id: UUID;
  person_id: UUID;
  staff_code: string | null;
  job_id: UUID;
  group_id: UUID;
  user_id: UUID | null;
  status: 'active' | 'suspended' | 'ended';
  hired_at: string | null;
  ended_at: string | null;
  notes: string | null;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
};

// ---------------------------------------------------------------------------
// Insert types
// ---------------------------------------------------------------------------

export type InsertRoleDefinition = Pick<RoleDefinition, 'code' | 'name_ar'> & Partial<Pick<RoleDefinition, 'name_en' | 'description' | 'is_active'>>;
export type InsertSystemUser = Pick<SystemUser, 'auth_user_id'> & Partial<Pick<SystemUser, 'person_id' | 'is_active'>>;
export type InsertPersonRole = Pick<PersonRole, 'person_id' | 'role_id'> & Partial<Pick<PersonRole, 'granted_by'>>;
export type InsertAuditLog = Pick<AuditLog, 'action' | 'entity_type'> & Partial<Pick<AuditLog, 'actor_user_id' | 'entity_id' | 'old_data' | 'new_data' | 'ip_address' | 'user_agent'>>;

export type InsertPerson = Pick<Person, 'national_id' | 'first_name' | 'second_name' | 'third_name' | 'last_name'> & Partial<Pick<Person, 'internal_code' | 'phone_number' | 'emergency_contact'>>;
export type InsertFamilyLink = Pick<FamilyLink, 'person_id' | 'related_person_id' | 'relation_type'> & Partial<Pick<FamilyLink, 'is_active'>>;
export type InsertMembership = Pick<Membership, 'type' | 'main_person_id'> & Partial<Pick<Membership, 'status'>>;
export type InsertMembershipMember = Pick<MembershipMember, 'membership_id' | 'person_id' | 'relation_type'> & Partial<Pick<MembershipMember, 'status'>>;
export type InsertMembershipNumberRegistry = Pick<MembershipNumberRegistry, 'membership_number' | 'number_type' | 'person_id' | 'membership_id'> & Partial<Pick<MembershipNumberRegistry, 'membership_member_id' | 'is_current' | 'reason' | 'ended_at'>>;
export type InsertMembershipNumberSequence = Pick<MembershipNumberSequence, 'base_membership_number'> & Partial<Pick<MembershipNumberSequence, 'next_dependent_suffix'>>;
export type InsertDependentConversionRule = Pick<DependentConversionRule, 'relation_type'> & Partial<Pick<DependentConversionRule, 'min_age_years' | 'min_membership_days' | 'requires_admin_approval' | 'requires_board_approval' | 'requires_payment' | 'is_separation_allowed'>>;
export type InsertMembershipSeparationRequest = Pick<MembershipSeparationRequest, 'membership_member_id'> & Partial<Omit<MembershipSeparationRequest, 'id' | 'membership_member_id' | 'created_at' | 'updated_at'>>;

// ---------------------------------------------------------------------------
export type InsertStaffCategory = Pick<StaffCategory, 'name'> & Partial<Pick<StaffCategory, 'description' | 'is_active'>>;
export type InsertStaffSubcategory = Pick<StaffSubcategory, 'category_id' | 'name'> & Partial<Pick<StaffSubcategory, 'description' | 'is_active'>>;
export type InsertStaffGroup = Pick<StaffGroup, 'name'> & Partial<Pick<StaffGroup, 'description' | 'role_id' | 'is_active'>>;
export type InsertStaffJob = Pick<StaffJob, 'category_id' | 'name'> & Partial<Pick<StaffJob, 'subcategory_id' | 'default_group_id' | 'description' | 'is_training_sector' | 'is_training_commissionable' | 'account_policy' | 'is_active'>>;
export type InsertStaffMember = Pick<StaffMember, 'person_id' | 'job_id' | 'group_id'> & Partial<Pick<StaffMember, 'staff_code' | 'user_id' | 'status' | 'hired_at' | 'ended_at' | 'notes'>>;

// ---------------------------------------------------------------------------
// Placeholder Database type
// ---------------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      role_definitions: { Row: RoleDefinition; Insert: InsertRoleDefinition; Update: Partial<InsertRoleDefinition>; };
      system_permissions: { Row: SystemPermission; Insert: Omit<SystemPermission, 'created_at'>; Update: Partial<Omit<SystemPermission, 'code' | 'created_at'>>; };
      system_role_permissions: { Row: SystemRolePermission; Insert: SystemRolePermission; Update: never; };
      system_users: { Row: SystemUser; Insert: InsertSystemUser; Update: Partial<InsertSystemUser>; };
      person_roles: { Row: PersonRole; Insert: InsertPersonRole; Update: Partial<PersonRole>; };
      audit_logs: { Row: AuditLog; Insert: InsertAuditLog; Update: never; };
      
      people: { Row: Person; Insert: InsertPerson; Update: Partial<InsertPerson>; };
      family_links: { Row: FamilyLink; Insert: InsertFamilyLink; Update: Partial<InsertFamilyLink>; };
      memberships: { Row: Membership; Insert: InsertMembership; Update: Partial<InsertMembership>; };
      membership_members: { Row: MembershipMember; Insert: InsertMembershipMember; Update: Partial<InsertMembershipMember>; };
      membership_number_registry: { Row: MembershipNumberRegistry; Insert: InsertMembershipNumberRegistry; Update: Partial<InsertMembershipNumberRegistry>; };
      membership_number_sequences: { Row: MembershipNumberSequence; Insert: InsertMembershipNumberSequence; Update: Partial<InsertMembershipNumberSequence>; };
      dependent_conversion_rules: { Row: DependentConversionRule; Insert: InsertDependentConversionRule; Update: Partial<InsertDependentConversionRule>; };
      membership_separation_requests: { Row: MembershipSeparationRequest; Insert: InsertMembershipSeparationRequest; Update: Partial<InsertMembershipSeparationRequest>; };
      staff_categories: { Row: StaffCategory; Insert: InsertStaffCategory; Update: Partial<InsertStaffCategory>; };
      staff_subcategories: { Row: StaffSubcategory; Insert: InsertStaffSubcategory; Update: Partial<InsertStaffSubcategory>; };
      staff_groups: { Row: StaffGroup; Insert: InsertStaffGroup; Update: Partial<InsertStaffGroup>; };
      staff_jobs: { Row: StaffJob; Insert: InsertStaffJob; Update: Partial<InsertStaffJob>; };
      staff_members: { Row: StaffMember; Insert: InsertStaffMember; Update: Partial<InsertStaffMember>; };
    };
    Views: Record<string, never>;
    Functions: {
      has_permission: { Args: { permission_code: string }; Returns: boolean; };
      current_person_id: { Args: Record<string, never>; Returns: UUID | null; };
      is_system_admin: { Args: Record<string, never>; Returns: boolean; };
      
      create_working_membership: {
        Args: {
          p_membership_number: string;
          p_national_id: string;
          p_first_name: string;
          p_second_name: string;
          p_third_name: string;
          p_last_name: string;
          p_phone_number?: string;
          p_email?: string;
        };
        Returns: unknown; // Returns jsonb
      };
      add_working_membership_to_person: {
        Args: {
          p_person_id: UUID;
          p_membership_number: string;
        };
        Returns: unknown;
      };
      add_dependent_to_membership: {
        Args: {
          p_membership_id: UUID;
          p_relation_type: string;
          p_national_id: string;
          p_first_name: string;
          p_second_name: string;
          p_third_name: string;
          p_last_name: string;
          p_phone_number?: string;
          p_email?: string;
        };
        Returns: unknown; // Returns jsonb
      };
      add_existing_person_as_dependent: {
        Args: {
          p_membership_id: UUID;
          p_person_id: UUID;
          p_relation_type: string;
        };
        Returns: unknown;
      };
      create_staff_member_transaction: {
        Args: { p_payload: unknown };
        Returns: unknown;
      };
      update_staff_member_transaction: {
        Args: { p_payload: unknown };
        Returns: unknown;
      };
      archive_staff_member_transaction: {
        Args: { p_payload: unknown };
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
  };
};
