import { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'user' | 'admin' | 'moderator';

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UserWithProfile extends SupabaseUser {
  profile?: Profile;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  name?: string;
}

export interface UpdateProfileData {
  name?: string;
  avatar?: string;
  role?: UserRole;
}

export interface AuthState {
  user: UserWithProfile | null;
  session: any | null;
  loading: boolean;
}
