export type ProjectStatus = 'draft' | 'pending' | 'approved' | 'rejected';

// 数据库中的项目结构
export interface DBProject {
  id: string;
  name: string;
  description: string;
  project_url: string;
  status: ProjectStatus;
  featured: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  thumbnail_url?: string;
  categories?: string[];
  likes?: number;
  comments?: number;
}

// 前端使用的项目结构
export interface Project {
  id: string;
  name: string;
  description: string;
  project_url: string;
  thumbnail_url?: string | null;
  categories?: string[];
  status: ProjectStatus;
  featured: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  user?: any;
  likes?: number;
  comments?: number;
}

// 项目提交表单数据结构
export interface ProjectSubmission {
  name: string;
  description: string;
  project_url: string;
  thumbnail_url?: string;
  categories?: string[];
}
