import { User } from '../../../types';

// 项目状态
export type ProjectStatus = 'pending' | 'approved' | 'featured' | 'rejected';

// 数据库中的项目结构
export interface DBProject {
  id: string;
  name: string;
  description: string;
  project_url: string;
  thumbnail_url: string;
  categories: string[];
  user_id: string;
  status: ProjectStatus;
  featured: boolean;
  likes: number;
  comments: number;
  created_at: string;
  updated_at: string;
}

// 前端使用的项目结构
export interface Project extends Omit<DBProject, 'user_id'> {
  userId: string;
  user?: User;
}

// 创建项目时的数据结构
export interface ProjectSubmission {
  name: string;
  description: string;
  project_url: string;
  thumbnail_url?: string;
  categories?: string[];
}

// 项目查询参数
export interface ProjectQuery {
  status?: ProjectStatus;
  featured?: boolean;
  userId?: string;
  category?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

// 项目统计信息
export interface ProjectStats {
  totalProjects: number;
  pendingProjects: number;
  approvedProjects: number;
  rejectedProjects: number;
  featuredProjects: number;
}
