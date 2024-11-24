import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ProjectCard from '../components/ProjectCard';
import type { Project } from '../types';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const searchProjects = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(data || []);
      } catch (error) {
        console.error('Error searching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      searchProjects();
    }
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-950 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-white mb-8">
          Search Results for "{query}"
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">No projects found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}