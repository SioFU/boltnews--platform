import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import type { Project, ProjectSubmission, ProjectStatus } from '../types';
import { handleError, mapError, ErrorType } from '../utils/errorHandler';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Extract project reference from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
if (!projectRef) {
  throw new Error('Invalid Supabase URL format');
}

// Use Supabase's default storage key format
const storageKey = `sb-${projectRef}-auth-token`;
console.log('Using storage key:', storageKey);

// Supabase client configuration
const supabaseConfig = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  },
  global: {
    headers: {
      'x-client-info': 'project-management'
    }
  },
  db: {
    schema: 'public'
  }
};

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, supabaseConfig);

// 添加会话状态监听
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session?.user?.id);
});

// Initialize Supabase schema and tables
async function initializeSupabase() {
  try {
    // Check if database connection is working by attempting to query users table
    const { error: testError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('Database connection error:', testError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    return false;
  }
}

// 添加请求调试
const debugRequest = async (url: string, options: any) => {
  console.log('=== Supabase Request Debug ===');
  console.log('URL:', url);
  console.log('Options:', options);
  return { url, options };
};

// 添加响应调试
const debugResponse = async (response: Response) => {
  console.log('Response:', {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries())
  });
  if (response.status !== 204) {
    const clonedResponse = response.clone();
    try {
      const data = await clonedResponse.json();
      console.log('Response data:', data);
    } catch (e) {
      console.log('Could not parse response as JSON');
    }
  }
  console.log('=== End Request Debug ===');
  return response;
};

// 添加错误调试
const debugError = (error: any) => {
  console.error('Request failed:', error);
  throw error;
};

// 包装 Supabase 方法以添加调试
const originalFrom = supabase.from.bind(supabase);
const from = (table: string) => {
  return originalFrom(table);
};

export interface Project {
  id: string;
  name: string;
  description: string;
  project_url: string;
  thumbnail_url: string;
  categories: string[];
  status: ProjectStatus;
  featured: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  likes: number;
  comments: number;
  user: {
    id: string;
    email: string;
    username: string;
    avatar_url: string;
    role: string;
  } | undefined;
}

export interface Comment {
  id: string;
  content: string;
  project_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Like {
  id: string;
  project_id: string;
  user_id: string;
  created_at: string;
}

// 数据转换函数
function dbToFrontend(dbProject: DBProject & { profiles?: any }): Project {
  return {
    id: dbProject.id,
    name: dbProject.name,
    description: dbProject.description,
    project_url: dbProject.project_url,
    thumbnail_url: dbProject.thumbnail_url,
    categories: dbProject.categories,
    status: dbProject.status,
    featured: dbProject.featured,
    user_id: dbProject.user_id,
    created_at: dbProject.created_at,
    updated_at: dbProject.updated_at,
    likes: 0,  // 这些值会在后面的查询中更新
    comments: 0,
    user: dbProject.profiles ? {
      id: dbProject.profiles.id,
      email: dbProject.profiles.email,
      username: dbProject.profiles.name,
      avatar_url: dbProject.profiles.avatar,
      role: dbProject.profiles.role
    } : undefined
  };
}

function frontendToDB(project: ProjectSubmission): Partial<DBProject> {
  return {
    name: project.name,
    description: project.description,
    project_url: project.project_url,
    thumbnail_url: project.thumbnail_url,
    categories: project.categories
  };
}

const projectService = {
  async uploadProjectImage(file: File) {
    try {
      // 验证文件是否存在
      if (!file) {
        throw new Error('No file provided');
      }

      // 验证文件类型
      const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only PNG, JPEG, GIF and WebP images are allowed.');
      }

      // 验证文件大小 (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 5MB.');
      }

      // 验证用户是否已登录
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('User authentication error:', userError);
        throw new Error('Authentication error: ' + userError.message);
      }
      if (!user) {
        throw new Error('You must be logged in to upload images');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Attempting to upload file:', {
        bucket: 'project-images',
        path: filePath,
        size: file.size,
        type: file.type
      });

      // 上传文件
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('project-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', {
          code: uploadError.statusCode,
          message: uploadError.message,
          details: uploadError
        });
        if (uploadError.statusCode === '403') {
          throw new Error('Permission denied. Please make sure you are logged in and have the correct permissions.');
        }
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('File uploaded successfully:', uploadData);

      // 获取公共 URL
      const { data: urlData } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      console.log('Generated public URL:', urlData.publicUrl);

      return { data: { publicUrl: urlData.publicUrl }, error: null };
    } catch (error: any) {
      console.error('Error in uploadProjectImage:', {
        message: error.message,
        details: error
      });
      return { 
        data: null, 
        error: {
          message: error.message || 'Failed to upload image',
          details: error.details || error
        }
      };
    }
  },

  async submitProject(projectData: ProjectSubmission) {
    console.log('Starting submitProject with data:', projectData);
    let retries = 3;
    let lastError = null;

    while (retries > 0) {
      try {
        console.log(`Attempt ${4 - retries} to submit project...`);
        
        // 获取当前用户
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          const error = new Error('No authenticated user found');
          console.error(error);
          throw error;
        }

        console.log('Using authenticated user:', user.id);

        const projectToSave = {
          ...projectData,
          user_id: user.id,
          status: 'pending' as ProjectStatus,
          featured: false
        };

        console.log('Preparing to save project:', projectToSave);
        
        // 检查数据库连接
        const { error: testError } = await supabase
          .from('projects')
          .select('id')
          .limit(1);

        if (testError) {
          console.error('Database connection test failed:', testError);
          throw testError;
        }

        // 使用事务来保证数据一致性
        const { data, error } = await supabase
          .from('projects')
          .insert(projectToSave)
          .select()
          .single();

        console.log('Database response:', { data, error });

        if (error) {
          console.error('Database error:', error);
          throw error;
        }

        return { data, error: null };
      } catch (error) {
        console.error(`Error in submitProject (attempt ${4 - retries}):`, error);
        lastError = error;
        retries--;
        
        if (retries > 0) {
          console.log(`Waiting before retry...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    console.error('All retry attempts failed');
    const mappedError = mapError(lastError);
    throw mappedError;
  },

  async getAllProjects() {
    const { data, error } = await supabase
      .from('project_stats')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getApprovedProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getFeaturedProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          users:user_id (
            id,
            email,
            name,
            avatar
          )
        `)
        .eq('status', 'approved')
        .eq('featured', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching featured projects:', error);
        throw error;
      }

      return data.map(project => ({
        ...project,
        user: project.users ? {
          id: project.users.id,
          email: project.users.email,
          username: project.users.name,
          avatar_url: project.users.avatar,
          role: 'user'
        } : undefined
      }));
    } catch (error) {
      console.error('Error in getFeaturedProjects:', error);
      throw error;
    }
  },

  async getPendingProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          users:user_id (
            id,
            email,
            name,
            avatar
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in getPendingProjects:', error);
      throw error;
    }
  },

  async getAllProjectsAdmin(): Promise<Project[]> {
    try {
      console.log('=== getAllProjectsAdmin Debug ===');
      console.log('1. Starting to fetch projects...');
      
      // 首先检查用户权限
      const isAdmin = await adminService.isAdmin();
      console.log('2. Admin check:', { isAdmin });
      
      if (!isAdmin) {
        console.log('3. User is not admin, returning empty array');
        return [];
      }
      
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*, users(*)')
        .order('created_at', { ascending: false });

      console.log('4. Query response:', {
        hasData: !!projectsData,
        dataLength: projectsData?.length || 0,
        error: projectsError?.message,
        firstProject: projectsData?.[0]
      });

      if (projectsError) {
        console.error('5. Error fetching projects:', projectsError);
        throw projectsError;
      }

      if (!projectsData || projectsData.length === 0) {
        console.log('5. No projects found in database');
        return [];
      }

      console.log('5. Projects found:', projectsData.length);
      console.log('6. Sample project:', JSON.stringify(projectsData[0], null, 2));

      const mappedProjects = projectsData.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        project_url: project.project_url,
        thumbnail_url: project.thumbnail_url,
        categories: project.categories || [],
        status: project.status,
        featured: project.featured,
        user_id: project.user_id,
        likes: project.likes || 0,
        comments: project.comments || 0,
        created_at: project.created_at,
        updated_at: project.updated_at,
        user: project.users
      }));

      console.log('7. Mapped projects:', mappedProjects);
      return mappedProjects;
    } catch (error) {
      console.error('Error in getAllProjectsAdmin:', error);
      throw error;
    }
  },

  async getUserProjects(userId: string) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          users:user_id (
            id,
            email,
            name,
            avatar
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(project => ({
        ...project,
        user: project.users ? {
          id: project.users.id,
          email: project.users.email,
          username: project.users.name,
          avatar_url: project.users.avatar,
          role: 'user'
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching user projects:', error);
      throw error;
    }
  },

  async getProjectById(id: string) {
    const { data, error } = await supabase
      .from('project_stats')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProjectStatus(id: string, status: ProjectStatus, featured: boolean = false) {
    try {
      // Check admin permission
      const isAdmin = await adminService.isAdmin();
      if (!isAdmin) {
        throw new Error('Unauthorized: User is not an admin');
      }

      // 更新项目状态和精选状态
      const { data, error } = await supabase
        .from('projects')
        .update({ 
          status, 
          featured,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating project status:', error);
        throw error;
      }

      console.log('Project status updated:', { id, status, featured });
      return data;
    } catch (error) {
      console.error('Error in updateProjectStatus:', error);
      throw error;
    }
  },

  async incrementViewCount(id: string) {
    const { error } = await supabase.rpc('increment_view_count', { project_id: id });
    if (error) throw error;
  },

  async getProjectComments(projectId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id(name, avatar_url)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async addComment(projectId: string, content: string) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('comments')
      .insert([{ project_id: projectId, user_id: userId, content }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteComment(commentId: string) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  },

  async likeProject(projectId: string) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { error } = await supabase
      .from('likes')
      .insert([{ project_id: projectId, user_id: userId }]);

    if (error) throw error;
  },

  async unlikeProject(projectId: string) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { error } = await supabase
      .from('likes')
      .delete()
      .match({ project_id: projectId, user_id: userId });

    if (error) throw error;
  },

  async hasUserLiked(projectId: string) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .match({ project_id: projectId, user_id: userId })
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  async getProjectLikes(projectId: string) {
    const { count, error } = await supabase
      .from('likes')
      .select('id', { count: 'exact' })
      .eq('project_id', projectId);

    if (error) throw error;
    return count;
  },

  async initializeDatabase() {
    try {
      console.log('=== Initializing Database ===');
      
      // 检查用户是否是管理员
      const isAdmin = await adminService.isAdmin();
      if (!isAdmin) {
        throw new Error('Only admins can initialize database');
      }

      // 创建或更新 projects 表
      const { error: projectsError } = await supabase.rpc('create_projects_table');
      if (projectsError) {
        console.error('Error creating projects table:', projectsError);
        throw projectsError;
      }
      console.log('Projects table initialized');

      // 创建或更新 comments 表
      const { error: commentsError } = await supabase.rpc('create_comments_table');
      if (commentsError) {
        console.error('Error creating comments table:', commentsError);
        throw commentsError;
      }
      console.log('Comments table initialized');

      // 创建或更新 likes 表
      const { error: likesError } = await supabase.rpc('create_likes_table');
      if (likesError) {
        console.error('Error creating likes table:', likesError);
        throw likesError;
      }
      console.log('Likes table initialized');

      console.log('Database initialization completed successfully');
      return true;
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  },

  async addSampleProjects() {
    try {
      console.log('=== Adding Sample Projects ===');
      
      // 检查用户是否已登录
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      console.log('Current user:', user);

      // 检查是否是管理员
      const isAdmin = await adminService.isAdmin();
      if (!isAdmin) {
        throw new Error('Only admins can add sample projects');
      }
      console.log('Admin check passed');

      const sampleProjects = [
        {
          name: 'AI Image Generator',
          description: 'A cutting-edge AI-powered image generation tool using stable diffusion.',
          project_url: 'https://github.com/example/ai-image-generator',
          thumbnail_url: 'https://picsum.photos/800/600',
          categories: ['AI', 'Image Processing'],
          status: 'approved',
          featured: true,
          user_id: user.id,
          likes: 0,
          comments: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'Smart Home Dashboard',
          description: 'IoT dashboard for monitoring and controlling smart home devices.',
          project_url: 'https://github.com/example/smart-home',
          thumbnail_url: 'https://picsum.photos/800/601',
          categories: ['IoT', 'Dashboard'],
          status: 'pending',
          featured: false,
          user_id: user.id,
          likes: 0,
          comments: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'Blockchain Wallet',
          description: 'Secure cryptocurrency wallet with multi-chain support.',
          project_url: 'https://github.com/example/crypto-wallet',
          thumbnail_url: 'https://picsum.photos/800/602',
          categories: ['Blockchain', 'Fintech'],
          status: 'pending',
          featured: false,
          user_id: user.id,
          likes: 0,
          comments: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      console.log('Inserting sample projects:', sampleProjects);
      
      // 先删除旧的示例项目
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('user_id', user.id);
      
      if (deleteError) {
        console.error('Error deleting old projects:', deleteError);
        throw deleteError;
      }
      console.log('Old projects deleted');

      // 插入新的示例项目
      const { data, error: insertError } = await supabase
        .from('projects')
        .insert(sampleProjects)
        .select();

      if (insertError) {
        console.error('Error adding sample projects:', insertError);
        throw insertError;
      }

      console.log('Sample projects added successfully:', data);
      
      // 添加一些延迟，确保数据已经写入
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return data;
    } catch (error) {
      console.error('Error in addSampleProjects:', error);
      throw error;
    }
  },
};

const blogService = {
  async getAllPosts() {
    try {
      const { data, error } = await supabase
        .from('blog_posts_with_authors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      return [];
    }
  },

  async getPost(slug: string) {
    try {
      const { data, error } = await supabase
        .from('blog_posts_with_authors')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching blog post:', error);
      return null;
    }
  },

  async createPost(postData: any) {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(postData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw error;
    }
  },

  async updatePost(postId: string, postData: any) {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating blog post:', error);
      throw error;
    }
  },

  async deletePost(postId: string) {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting blog post:', error);
      throw error;
    }
  },
};

const adminService = {
  // 管理员状态缓存
  _adminCache: new Map<string, { isAdmin: boolean; timestamp: number }>(),
  _cacheDuration: 5 * 60 * 1000, // 5 minutes

  // 检查当前用户是否是管理员
  async isAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      // 检查缓存
      const cached = this._adminCache.get(user.id);
      if (cached && Date.now() - cached.timestamp < this._cacheDuration) {
        return cached.isAdmin;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      const isAdmin = userData?.role === 'admin';
      
      // 更新缓存
      this._adminCache.set(user.id, {
        isAdmin,
        timestamp: Date.now()
      });

      return isAdmin;
    } catch (error) {
      console.error('Error in isAdmin:', error);
      return false;
    }
  },

  // 清除管理员状态缓存
  clearAdminCache(userId?: string) {
    if (userId) {
      this._adminCache.delete(userId);
    } else {
      this._adminCache.clear();
    }
  },

  // 创建管理员账号
  async createAdmin(email: string, password: string) {
    try {
      // 创建新用户
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // 设置用户为管理员
      if (authData.user) {
        await this.setUserAsAdmin(authData.user.id);
      }

      return authData;
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  },

  // 将指定用户设置为管理员
  async setUserAsAdmin(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', userId);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error setting user as admin:', error);
      throw error;
    }
  },

  // 获取当前用户信息
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting current user:', error);
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  },

  // 初始化数据库
  async initializeDatabase() {
    try {
      console.log('=== Initializing Database ===');
      
      // 创建用户表
      const { error: createError } = await supabase.rpc('create_users_table');
      if (createError) {
        console.error('Error creating users table:', createError);
        throw createError;
      }
      
      console.log('Database initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  },
};

// 添加会话状态检查
async function ensureAuthInitialized() {
  const maxAttempts = 10;
  const interval = 500; // 500ms
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      console.log(`Checking auth session (attempt ${i + 1}/${maxAttempts})...`);
      
      // 检查所有可能的存储位置
      if (typeof window !== 'undefined') {
        const authToken = localStorage.getItem(storageKey);
        console.log('Auth token exists:', !!authToken);
        if (authToken) {
          try {
            const parsed = JSON.parse(authToken);
            console.log('Auth token data:', {
              expires_at: parsed.expires_at,
              user_id: parsed.user?.id
            });
          } catch (e) {
            console.error('Failed to parse auth token:', e);
          }
        }
      }
      
      const { data, error } = await supabase.auth.getSession();
      console.log('getSession response:', { 
        hasSession: !!data?.session,
        error: error?.message
      });
      
      if (error) {
        console.error('Error getting session:', error);
        throw error;
      }
      
      if (data?.session) {
        console.log('Valid session found:', {
          user_id: data.session.user?.id,
          expires_at: data.session.expires_at,
          access_token: data.session.access_token ? '(exists)' : '(missing)'
        });
        return data.session;
      }
      
      // 如果没有会话，先尝试刷新会话
      console.log('No session found, attempting to refresh...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Failed to refresh session:', refreshError);
      } else if (refreshData?.session) {
        console.log('Session refreshed successfully:', {
          user_id: refreshData.session.user?.id,
          expires_at: refreshData.session.expires_at
        });
        return refreshData.session;
      }
      
      // 如果刷新失败，检查用户状态
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Failed to get user:', userError);
      } else {
        console.log('Current user data:', userData);
        
        if (userData?.user) {
          // 如果有用户但没有会话，尝试重新获取会话
          const { data: newSession, error: newSessionError } = await supabase.auth.getSession();
          if (newSessionError) {
            console.error('Failed to get new session:', newSessionError);
          } else if (newSession?.session) {
            console.log('New session created for existing user:', {
              user_id: newSession.session.user?.id,
              expires_at: newSession.session.expires_at
            });
            return newSession.session;
          }
        }
      }
      
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
    }
    
    if (i < maxAttempts - 1) {
      console.log(`Waiting ${interval}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  const error = new Error('Failed to initialize auth session after multiple attempts');
  console.error(error);
  throw error;
}

// Export all services and initialization function
export { supabase, projectService, blogService, adminService, initializeSupabase };