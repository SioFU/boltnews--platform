import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { projectService } from '../lib/supabase';
import { Shield, Star, StarOff, Eye, ThumbsUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { ProjectStatus } from '../types';

interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  status: ProjectStatus;
  created_at: string;
  view_count: number;
}

export default function AdminProjects() {
  const { isAdmin, loading } = useAuthStore();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'featured'>('all');

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    loadProjects();
  }, [filter]);

  const loadProjects = async () => {
    try {
      let projectList;
      switch (filter) {
        case 'featured':
          projectList = await projectService.getFeaturedProjects();
          break;
        case 'approved':
          projectList = await projectService.getApprovedProjects();
          break;
        default:
          projectList = await projectService.getAllProjects();
      }
      setProjects(projectList);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('加载项目列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (projectId: string, featured: boolean) => {
    try {
      await projectService.updateProjectStatus(
        projectId,
        'approved',
        featured
      );
      toast.success(featured ? '已设为精选' : '已取消精选');
      loadProjects();
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error('更新项目状态失败');
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-500" />
            <h1 className="text-2xl font-bold text-white">项目管理</h1>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'approved'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              已上架
            </button>
            <button
              onClick={() => setFilter('featured')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'featured'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              精选
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 bg-gray-900 rounded-lg">
            <p className="text-gray-400">暂无项目</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-900 rounded-lg p-6 flex flex-col"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    提交于{' '}
                    {formatDistanceToNow(new Date(project.created_at), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </p>
                  <p className="text-gray-300 mb-4 line-clamp-3">
                    {project.description}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      <span>{project.view_count}</span>
                    </div>
                    <div className="flex items-center">
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      <span>0</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    访问项目 →
                  </a>

                  <button
                    onClick={() =>
                      handleStatusChange(
                        project.id,
                        project.status !== 'featured'
                      )
                    }
                    className={`p-2 rounded-lg transition-colors ${
                      project.status === 'featured'
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                    title={
                      project.status === 'featured' ? '取消精选' : '设为精选'
                    }
                  >
                    {project.status === 'featured' ? (
                      <StarOff className="h-5 w-5 text-white" />
                    ) : (
                      <Star className="h-5 w-5 text-gray-300" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
