import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, ThumbsUp, MessageSquare } from 'lucide-react';
import { projectService } from '../../lib/supabase';
import { adminService } from '../../lib/supabase';
import type { Project, User, ProjectStatus } from '../../types';
import toast from 'react-hot-toast';

interface ProjectWithUser extends Project {
  user?: User;
}

export default function ProjectManagement() {
  const [projects, setProjects] = useState<ProjectWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const allProjects = await projectService.getAllProjectsAdmin();
      setProjects(allProjects || []);
    } catch (error: any) {
      console.error('Error loading projects:', error);
      toast.error(error.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (projectId: string, status: ProjectStatus) => {
    try {
      setUpdatingStatus(projectId);
      
      // 乐观更新
      setProjects(prev => 
        prev.map(project => 
          project.id === projectId 
            ? { ...project, status } 
            : project
        )
      );
      
      await projectService.updateProjectStatus(projectId, status);
      toast.success(`Project status updated to ${status}`);
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error('Failed to update project status');
      
      // 如果失败，恢复原始状态
      setProjects(prev => 
        prev.map(project => 
          project.id === projectId 
            ? { ...project, status: project.status } 
            : project
        )
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleFeatureToggle = async (projectId: string, featured: boolean) => {
    try {
      // 乐观更新
      setProjects(prev => 
        prev.map(project => 
          project.id === projectId 
            ? { ...project, featured } 
            : project
        )
      );

      const project = projects.find(p => p.id === projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      await projectService.updateProjectStatus(projectId, project.status, featured);
      toast.success(`Project ${featured ? 'featured' : 'unfeatured'} successfully`);
    } catch (error) {
      console.error('Error updating project featured status:', error);
      toast.error('Failed to update project featured status');
      // 如果失败，恢复原始状态
      setProjects(prev => 
        prev.map(project => 
          project.id === projectId 
            ? { ...project, featured: !featured } 
            : project
        )
      );
    }
  };

  const filteredProjects = projects.filter(project => {
    if (filter === 'all' || filter === '') return true;
    return project.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Table */}
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-[25%]">
                Project ({projects.length})
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-[12%]">Categories</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-[6%]">Links</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-[15%]">Author</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-[10%]">Created</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-[7%]">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as ProjectStatus | 'all')}
                  className="bg-gray-800 text-gray-300 rounded-lg px-2 py-0.5 text-xs border border-gray-700/50 focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="all">Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-[6%]">Featured</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {filteredProjects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-800 transition-colors duration-200 cursor-pointer group">
                <td className="px-2 py-2">
                  <div className="flex items-center">
                    <div className="h-8 w-8 flex-shrink-0">
                      <img
                        className="h-8 w-8 rounded-lg object-cover transition-transform duration-200 group-hover:scale-105"
                        src={project.thumbnail_url || 'https://placehold.co/100x100?text=No+Image'}
                        alt=""
                      />
                    </div>
                    <div className="ml-2 min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-200 truncate">{project.name}</div>
                      <div className="mt-1 text-sm text-gray-400 truncate max-w-md">{project.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className="flex flex-wrap gap-1">
                    {project.categories?.slice(0, 2).map((category, index) => (
                      <span
                        key={index}
                        className="px-1 py-0.5 text-xs rounded-full bg-gray-800/80 text-gray-300 border border-gray-700/50"
                      >
                        {category}
                      </span>
                    ))}
                    {project.categories && project.categories.length > 2 && (
                      <span className="px-1 py-0.5 text-xs rounded-full bg-gray-800/80 text-gray-300 border border-gray-700/50">
                        +{project.categories.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1">
                    {project.project_url && (
                      <a 
                        href={project.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                    {project.thumbnail_url && (
                      <a 
                        href={project.thumbnail_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg overflow-hidden">
                      <img 
                        src={project.user?.avatar || 'https://www.gravatar.com/avatar/?d=mp'} 
                        alt={project.user?.name || 'Anonymous'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-300 truncate">{project.user?.name || 'Anonymous'}</span>
                  </div>
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  <span className="text-sm text-gray-300">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  <select
                    value={project.status}
                    onChange={(e) => handleStatusChange(project.id, e.target.value as ProjectStatus)}
                    disabled={updatingStatus === project.id}
                    className={`px-1 py-0.5 text-xs rounded-full ${
                      project.status === 'approved' ? 'bg-green-900/50 text-green-300' : 
                      project.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' : 
                      'bg-red-900/50 text-red-300'
                    } ${updatingStatus === project.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
                <td className="px-2 py-2">
                  <button
                    onClick={() => handleFeatureToggle(project.id, !project.featured)}
                    className={`px-1 py-0.5 text-xs rounded-full transition-colors duration-200 ${
                      project.featured
                        ? 'bg-yellow-900/50 text-yellow-300 hover:bg-yellow-900/70'
                        : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80'
                    }`}
                  >
                    {project.featured ? 'Featured' : 'Feature'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-400">No matching projects found</h3>
        </div>
      )}
    </div>
  );
}