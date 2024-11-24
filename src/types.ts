// Project related types
export type ProjectStatus = 
  | 'pending'   // 等待审核
  | 'approved'  // 已通过
  | 'featured'  // 精选项目
  | 'rejected'; // 已拒绝

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  created_at: string;
  avatar?: string;
  bio?: string;
  website?: string;
  social?: any;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  project_url: string;
  thumbnail_url?: string;
  categories?: string[];
  user_id: string;
  status: ProjectStatus;
  featured: boolean;
  likes: number;
  comments: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface ProjectSubmission {
  name: string;
  description: string;
  project_url: string;
  thumbnail_url?: string;
  categories?: string[];
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

export interface Notification {
  id: string;
  user_id: string;
  type: 'comment' | 'like' | 'status_change';
  content: string;
  read: boolean;
  project_id: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published';
  user_id: string;
  created_at: string;
  updated_at: string;
  author_email?: string;
  author_name?: string;
  author_avatar?: string;
}