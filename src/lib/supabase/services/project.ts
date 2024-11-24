import { supabase, db } from '../client';
import { handleError, mapError } from '../../../utils/errorHandler';
import { cacheService } from '../utils/cache';
import type {
  Project,
  ProjectSubmission,
  ProjectQuery,
  ProjectStats,
  DBProject
} from '../types/project';

class ProjectService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // 数据转换：数据库 -> 前端
  private transformToProject(dbProject: DBProject & { profiles?: any }): Project {
    return {
      ...dbProject,
      userId: dbProject.user_id,
      user: dbProject.profiles ? {
        id: dbProject.profiles.id,
        email: dbProject.profiles.email,
        name: dbProject.profiles.name,
        avatar: dbProject.profiles.avatar,
        role: dbProject.profiles.role
      } : undefined
    };
  }

  // 数据转换：前端 -> 数据库
  private transformToDBProject(project: ProjectSubmission): Partial<DBProject> {
    return {
      name: project.name,
      description: project.description,
      project_url: project.project_url,
      thumbnail_url: project.thumbnail_url || '',
      categories: project.categories || []
    };
  }

  // 获取所有项目
  async getAllProjects(query: ProjectQuery = {}): Promise<Project[]> {
    try {
      // 检查缓存
      const cacheKey = cacheService.generateKey('projects', query);
      const cachedData = cacheService.get<Project[]>(cacheKey);
      if (cachedData) {
        console.log('Using cached projects data');
        return cachedData;
      }

      let dbQuery = supabase
        .from('projects')
        .select(`
          id,
          name,
          description,
          project_url,
          thumbnail_url,
          categories,
          user_id,
          status,
          featured,
          likes,
          comments,
          created_at,
          updated_at,
          profiles (
            id,
            name,
            email,
            avatar,
            role
          )
        `);

      // 应用查询条件
      if (query.status) {
        dbQuery = dbQuery.eq('status', query.status);
      }
      if (query.featured !== undefined) {
        dbQuery = dbQuery.eq('featured', query.featured);
      }
      if (query.userId) {
        dbQuery = dbQuery.eq('user_id', query.userId);
      }
      if (query.searchTerm) {
        dbQuery = dbQuery.ilike('name', `%${query.searchTerm}%`);
      }
      if (query.limit) {
        dbQuery = dbQuery.limit(query.limit);
      }
      if (query.offset) {
        dbQuery = dbQuery.range(query.offset, query.offset + (query.limit || 10) - 1);
      }

      console.log('Fetching fresh projects data');
      const { data, error } = await dbQuery;

      if (error) throw error;

      const projects = (data || []).map(this.transformToProject);
      
      // 缓存结果
      cacheService.set(cacheKey, projects, this.CACHE_TTL);

      return projects;
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }

  // 获取项目统计信息
  async getProjectStats(): Promise<ProjectStats> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('status, featured')
        .select();

      if (error) throw error;

      const stats = {
        totalProjects: data.length,
        pendingProjects: data.filter(p => p.status === 'pending').length,
        approvedProjects: data.filter(p => p.status === 'approved').length,
        rejectedProjects: data.filter(p => p.status === 'rejected').length,
        featuredProjects: data.filter(p => p.featured).length
      };

      return stats;
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }

  // 提交新项目
  async submitProject(projectData: ProjectSubmission): Promise<Project> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const projectToSave = {
        ...this.transformToDBProject(projectData),
        user_id: user.id,
        status: 'pending',
        featured: false
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(projectToSave)
        .select()
        .single();

      if (error) throw error;

      return this.transformToProject(data);
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }

  // 更新项目状态
  async updateProjectStatus(
    id: string,
    status: 'approved' | 'rejected' | 'featured',
    featured: boolean = false
  ): Promise<Project> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ status, featured })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.transformToProject(data);
    } catch (error) {
      handleError(mapError(error));
      throw error;
    }
  }
}

export const projectService = new ProjectService();
