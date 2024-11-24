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
    console.log('Initializing auth store...');
    if (get().initialized) {
      console.log('Auth store already initialized');
      set({ loading: false });
      return;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Initial session:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        error: sessionError?.message 
      });
      
      if (sessionError) throw sessionError;
      
      if (session?.user) {
        console.log('Setting initial user:', session.user.id);
        set({ user: session.user });
        await get().loadUserProfile(session.user.id);
        await get().checkAdmin();
      }

      // 设置认证状态变化监听器
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', { 
          event, 
          userId: session?.user?.id,
          hasSession: !!session 
        });
        
        if (event === 'INITIAL_SESSION') {
          // 忽略初始会话事件，因为我们已经在上面处理过了
          return;
        }
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            console.log('Updating user on auth change:', session.user.id);
            set({ user: session.user });
            await get().loadUserProfile(session.user.id);
            await get().checkAdmin();
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          set({ user: null, profile: null, isAdmin: false });
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('认证初始化失败:', error);
      toast.error('认证初始化失败');
    } finally {
      console.log('Auth initialization completed');
      set({ loading: false, initialized: true });
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
  }
}));