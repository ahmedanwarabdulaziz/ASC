export type UserRole = 'admin' | 'supervisor' | 'team_leader';

export type MemberStatus = 'chance' | 'called' | 'will_vote' | 'sure_vote' | 'voted';

export interface MemberStatusRecord {
  id: string;
  member_id: string;
  status: MemberStatus;
  supervisor_code?: string;
  leader_code?: string;
  updated_by: string;
  updated_by_name?: string;
  updated_by_email?: string;
  updated_by_user?: {
    id: string;
    email: string;
    display_name?: string;
    role: UserRole;
    code?: string;
    supervisor_id?: string;
    supervisor?: {
      id: string;
      email: string;
      display_name?: string;
      role: UserRole;
      code?: string;
    };
  };
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  supervisor_code?: string;
  leader_code?: string;
  created_at: string;
  updated_at: string;
  member_count?: number; // For display purposes
}

export interface MemberCategoryAssignment {
  id: string;
  member_id: string;
  category_id: string;
  category_name?: string;
  assigned_by: string;
  assigned_at: string;
}

export interface StatusConflict {
  id: string;
  member_id: string;
  member_name?: string;
  member?: {
    id: string;
    name?: string;
    member_id?: string;
  };
  status_ids: string[];
  statuses?: MemberStatusRecord[];
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
}

export interface ConflictNotification {
  id: string;
  conflict_id: string;
  user_id: string;
  read: boolean;
  created_at: string;
  conflict?: StatusConflict;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt: Date;
}

export interface Member {
  id: string;
  // Member identification
  memberId: string; // Column A - Member ID
  // Arabic search fields - optimized for fast Firestore queries
  name: string; // Column B - Original Arabic name
  nameSearch: string; // Normalized for search (remove diacritics, convert to lowercase)
  address?: string; // Column C - Address
  addressSearch?: string; // Normalized address for search
  job?: string; // Column D - Job title
  jobSearch?: string; // Normalized job for search
  phone?: string; // Column E - Landline phone
  mobile?: string; // Column F - Mobile phone
  searchTokens: string[]; // Array of search tokens for fast array-contains queries (name, address, job, mobile)
  email?: string;
  // Team assignment
  teamId?: string;
  teamName?: string;
  // Status tracking
  status: 'active' | 'inactive' | 'pending';
  notes?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  // Store all Excel columns as additional data
  [key: string]: any;
}

export interface Team {
  id: string;
  name: string;
  nameSearch: string; // Normalized for Arabic search
  candidateId: string;
  candidateName: string;
  members: string[]; // Member IDs
  createdAt: Date;
}

// Blog types
export interface SiteBio {
  id: string;
  bio_text: string;
  vision_text?: string;
  mission_text?: string;
  updated_by?: string;
  updated_at: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  primary_image_title?: string; // Title for the primary/featured image
  id: string;
  title: string;
  content: string; // HTML
  excerpt?: string;
  author_id: string;
  category_id?: string;
  featured_image_url?: string;
  thumbnail_image_url?: string;
  meta_description?: string;
  og_image_url?: string;
  is_featured: boolean;
  status: 'draft' | 'published';
  published_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: {
    id: string;
    email: string;
    display_name?: string;
  };
  category?: BlogCategory;
}

export interface BlogPostImage {
  id: string;
  post_id: string;
  image_url: string;
  alt_text?: string;
  order_index: number;
  created_at: string;
}

