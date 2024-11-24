import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ProjectCard from '../components/ProjectCard';
import ProjectSidebar from '../components/projects/ProjectSidebar';
import ProjectSearch from '../components/projects/ProjectSearch';
import ProjectSort from '../components/projects/ProjectSort';
import type { Project } from '../types';
import { Loader } from 'lucide-react';

type SortOption = 'latest' | 'popular';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('latest');

  useEffect(() => {
    loadProjects();
  }, [sortBy]);

  useEffect(() => {
    filterAndSortProjects();
  }, [projects, selectedCategories, searchQuery]);

  const loadProjects = async () => {
    try {
      console.log('Loading projects...');
      let query = supabase
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
        .eq('status', 'approved');

      // 根据排序选项设置排序方式
      if (sortBy === 'latest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'popular') {
        query = query.order('likes', { ascending: false });
      }

      const { data: projectsData, error } = await query;

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }

      const formattedProjects = (projectsData || []).map(project => ({
        ...project,
        user: project.users ? {
          id: project.users.id,
          email: project.users.email,
          username: project.users.name,
          avatar_url: project.users.avatar,
          role: 'user'
        } : undefined
      }));

      console.log('Projects loaded:', formattedProjects);
      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProjects = () => {
    let filtered = [...projects];

    // 只应用过滤器，不再进行排序
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(project =>
        project.categories.some(cat => selectedCategories.includes(cat))
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query)
      );
    }

    setFilteredProjects(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-20 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <div className="flex items-center space-x-4">
            <ProjectSearch onSearch={setSearchQuery} />
            <ProjectSort value={sortBy} onChange={setSortBy} />
          </div>
        </div>

        <div className="flex gap-8">
          <ProjectSidebar
            selectedCategories={selectedCategories}
            onCategoryChange={setSelectedCategories}
          />
          
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            
            {filteredProjects.length === 0 && (
              <div className="text-center py-12 bg-gray-900 rounded-lg">
                <p className="text-gray-400">No projects found matching your criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}