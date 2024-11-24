import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User, Project } from '../types';
import { supabase, projectService } from '../lib/supabase';
import ProjectCard from '../components/ProjectCard';
import ProjectListView from '../components/ProjectListView';
import ProjectUploadForm from '../components/upload/ProjectUploadForm';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { BsGrid, BsList } from 'react-icons/bs';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

export const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);

  const { user: currentUser } = useAuthStore();
  const isOwner = currentUser?.id === userId;

  useEffect(() => {
    fetchUserAndProjects();
  }, [userId]);

  const fetchUserAndProjects = async () => {
    try {
      if (!userId) {
        toast.error('No user ID provided');
        setIsLoading(false);
        return;
      }

      // Fetch user profile from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setUser({
        ...userData,
        full_name: userData.name,
        avatar_url: userData.avatar
      });

      // 使用 projectService 来获取用户的项目
      try {
        const projectsData = await projectService.getUserProjects(userId);
        setProjects(projectsData);
      } catch (projectError) {
        console.error('Error fetching projects:', projectError);
        toast.error('Failed to load projects');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (project: Project) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== project.id));
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleEditSubmit = async (formData: Partial<Project>) => {
    if (!editingProject) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: formData.title,
          description: formData.description,
          project_url: formData.project_url,
          categories: formData.categories,
        })
        .eq('id', editingProject.id);

      if (error) throw error;

      setProjects(projects.map(p => p.id === editingProject.id ? { ...p, ...formData } : p));
      setIsEditModalOpen(false);
      setEditingProject(null);
      toast.success('Project updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center">
        <div className="text-center py-8 text-gray-400">User not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-950 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                  alt={user.full_name || 'User'}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-700 transition-all duration-300 hover:border-blue-500"
                />
                {isOwner && (
                  <motion.button
                    onClick={() => setIsProfileEditOpen(true)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 rounded-full p-2 shadow-lg transition-colors duration-200"
                  >
                    <span className="sr-only">Edit profile</span>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </motion.button>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-100">{user.full_name || 'Anonymous User'}</h1>
                <p className="text-gray-400">{user.email}</p>
                {user.bio && <p className="text-gray-300 mt-2">{user.bio}</p>}
                {user.website && (
                  <a 
                    href={user.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 mt-1 inline-flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Website
                  </a>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                  title="Grid View"
                >
                  <BsGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                  title="List View"
                >
                  <BsList className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-100">Projects</h2>
            <div className="text-sm text-gray-400">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="bg-gray-900 rounded-lg p-8 text-center">
              <p className="text-gray-400">No projects yet</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={isOwner ? handleEdit : undefined}
                  onDelete={isOwner ? handleDelete : undefined}
                />
              ))}
            </div>
          ) : (
            <ProjectListView
              projects={projects}
              onEdit={isOwner ? handleEdit : undefined}
              onDelete={isOwner ? handleDelete : undefined}
              isOwner={isOwner}
            />
          )}
        </div>
      </div>

      {isEditModalOpen && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/70" onClick={() => {
            setIsEditModalOpen(false);
            setEditingProject(null);
          }} />
          <div className="relative bg-gray-900 w-full max-w-4xl mx-4 rounded-lg shadow-xl">
            <ProjectUploadForm
              initialData={editingProject}
              onSubmit={handleEditSubmit}
              onClose={() => {
                setIsEditModalOpen(false);
                setEditingProject(null);
              }}
            />
          </div>
        </div>
      )}

      {isProfileEditOpen && user && isOwner && (
        <EditProfileModal
          user={user}
          onClose={() => setIsProfileEditOpen(false)}
          onUpdate={(updatedUser) => {
            setUser(updatedUser);
            // 重新获取用户数据和项目列表以确保数据同步
            fetchUserAndProjects();
          }}
        />
      )}
    </div>
  );
};