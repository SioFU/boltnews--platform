import React, { useEffect, useState } from 'react';
import { Check, X, Star, ExternalLink } from 'lucide-react';
import { projectService } from '../../lib/supabase';
import type { Project } from '../../types';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function ProjectReviewList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingProjects();
  }, []);

  const loadPendingProjects = async () => {
    try {
      const pendingProjects = await projectService.getPendingProjects();
      setProjects(pendingProjects);
    } catch (error) {
      console.error('Error loading pending projects:', error);
      toast.error('Failed to load pending projects');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectReview = async (projectId: string, status: 'approved' | 'rejected', featured: boolean = false) => {
    try {
      await projectService.updateProjectStatus(projectId, status, featured);
      setProjects(projects.filter(p => p.id !== projectId));
      toast.success(
        status === 'approved'
          ? featured
            ? 'Project approved and featured'
            : 'Project approved'
          : 'Project rejected'
      );
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error('Failed to update project status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-800 rounded-lg">
        <p className="text-gray-400">暂无待审核的项目</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div key={project.id} className="bg-gray-800 rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6 mt-4">
            <div
              className="bg-white shadow rounded-lg p-6 flex flex-col md:flex-row gap-6"
            >
              {project.thumbnail_url && (
                <img
                  src={project.thumbnail_url}
                  alt={project.name}
                  className="w-full md:w-48 h-32 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {project.name}
                    </h3>
                    <p className="mt-1 text-gray-500">
                      by {project.user?.name || 'Anonymous'}
                    </p>
                  </div>
                  <a
                    href={project.project_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
                <p className="text-gray-300 mb-4 whitespace-pre-wrap">
                  {project.description}
                </p>

                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => handleProjectReview(project.id, 'approved', true)}
                    className="p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    title="通过并设为精选"
                  >
                    <Star className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleProjectReview(project.id, 'approved')}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="通过"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleProjectReview(project.id, 'rejected')}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    title="拒绝"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}