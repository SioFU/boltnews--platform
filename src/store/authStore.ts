import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: string;
  bio?: string;
  website?: string;
  social?: any;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  initialized: boolean;
  checkAdmin: () => Promise<boolean>;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  loadUserProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  initialized: false,

  loadUserProfile: async (userId: string) => {
    try {
      console.log('Loading user profile for:', userId);
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // 如果用户不存在，尝试创建新的用户配置文件
        if (error.code === 'PGRST116') {
          const user = get().user;
          if (!user?.email) throw new Error('找不到用户邮箱');

          const newProfile = {
            id: userId,
            email: user.email,
            name: user.email.split('@')[0],
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=0D8ABC&color=fff`,
            role: 'user'
          };

          const { data, error: insertError } = await supabase
            .from('users')
            .insert([newProfile])
            .select()
            .single();

          if (insertError) {
            console.error('创建用户配置文件失败:', insertError);
            throw insertError;
          }
          
          set({ profile: data });
          return;
        }
        throw error;
      }

      set({ profile });
    } catch (error: any) {
      console.error('加载用户配置文件失败:', error);
      // 不要显示错误提示，因为配置文件可能正在创建中
      if (error.code !== 'PGRST116') {
        toast.error('加载用户配置文件失败');
      }
    }
  },

  checkAdmin: async () => {
    const { user } = get();
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('检查管理员状态失败:', error);
        return false;
      }

      const isAdmin = data?.role === 'admin';
      set({ isAdmin });
      return isAdmin;
    } catch (error) {
      console.error('检查管理员状态失败:', error);
      return false;
    }
  },

  initialize: async () => {
    try {
      set({ loading: true });
      console.log('Starting auth initialization...');
      
      // 使用 ensureAuthInitialized 确保认证状态
      const session = await ensureAuthInitialized();
      
      if (session?.user) {
        set({ user: session.user });
        // 加载用户资料和管理员状态
        await get().loadUserProfile(session.user.id);
        await get().checkAdmin();
      } else {
        set({ user: null, profile: null, isAdmin: false });
      }
      
      // 设置认证状态变化监听器
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', { event, userId: session?.user?.id });
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            set({ user: session.user });
            await get().loadUserProfile(session.user.id);
            await get().checkAdmin();
          }
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null, isAdmin: false });
        }
      });
      
      set({ initialized: true });
      console.log('Auth initialization completed');
    } catch (error) {
      console.error('Auth initialization failed:', error);
      set({ user: null, profile: null, isAdmin: false });
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const { profile } = get();
    if (!profile) return;

    try {
      // 更新名称
      if (updates.name && updates.name !== profile.name) {
        const { error: nameError } = await supabase
          .rpc('update_user_profile', {
            user_id: profile.id,
            user_name: updates.name
          });

        if (nameError) throw nameError;
      }

      // 更新头像
      if (updates.avatar && updates.avatar !== profile.avatar) {
        const { error: avatarError } = await supabase
          .rpc('update_user_avatar', {
            user_id: profile.id,
            avatar_url: updates.avatar
          });

        if (avatarError) throw avatarError;
      }

      // 更新本地状态
      set({ 
        profile: { 
          ...profile, 
          ...updates 
        } 
      });

    } catch (error) {
      console.error('更新用户资料失败:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, profile: null, isAdmin: false });
      toast.success('Successfully logged out');
    } catch (error: any) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout');
    }
  },

  setUser: (user: User | null) => {
    set({ user });
  },

  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, profile: null, isAdmin: false });
      toast.success('Successfully logged out');
    } catch (error: any) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout');
    }
  }
}));

// Helper function to ensure auth initialization
async function ensureAuthInitialized() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  return session;
}