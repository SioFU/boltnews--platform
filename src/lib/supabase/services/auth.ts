import { supabase } from '../client';
import { handleError, mapError } from '../../../utils/errorHandler';
import type {
  LoginCredentials,
  SignupData,
  UpdateProfileData,
  UserWithProfile,
  Profile
} from '../types/auth';

class AuthService {
  // 获取当前认证状态
  async getAuthState() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session?.user) {
        const profile = await this.getProfile(session.user.id);
        return {
          user: { ...session.user, profile },
          session,
          loading: false
        };
      }

      return { user: null, session: null, loading: false };
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }

  // 登录
  async login({ email, password }: LoginCredentials): Promise<UserWithProfile> {
    try {
      const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!user) throw new Error('Login failed');

      const profile = await this.getProfile(user.id);
      return { ...user, profile };
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }

  // 注册
  async signup({ email, password, name }: SignupData): Promise<UserWithProfile> {
    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) throw error;
      if (!user) throw new Error('Signup failed');

      // 创建用户档案
      const profile = await this.createProfile(user.id, { email, name });
      return { ...user, profile };
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }

  // 登出
  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }

  // 获取用户档案
  private async getProfile(userId: string): Promise<Profile | undefined> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(mapError(error));
      return undefined;
    }
  }

  // 创建用户档案
  private async createProfile(
    userId: string,
    { email, name }: { email: string; name?: string }
  ): Promise<Profile> {
    try {
      const profile = {
        id: userId,
        email,
        name: name || null,
        avatar: null,
        role: 'user' as const
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }

  // 更新用户档案
  async updateProfile(userId: string, updates: UpdateProfileData): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }

  // 重置密码
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: \`\${window.location.origin}/reset-password\`
      });
      if (error) throw error;
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }

  // 更新密码
  async updatePassword(password: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }

  // 获取所有用户档案（仅管理员）
  async getAllProfiles(): Promise<Profile[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (currentProfile?.role !== 'admin') {
        throw new Error('Unauthorized access');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }
}

export const authService = new AuthService();
