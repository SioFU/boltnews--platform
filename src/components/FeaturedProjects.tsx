import React, { useEffect, useState, useCallback } from 'react';
import ProjectCard from './ProjectCard';
import { projectService } from '../lib/supabase';
import type { Project } from '../types';
import toast from 'react-hot-toast'; 

export default function FeaturedProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // 使用 useCallback 缓存函数
  const loadFeaturedProjects = useCallback(async () => {
    try {
      const featuredProjects = await projectService.getFeaturedProjects();
      // 只在开发环境下打印日志
      if (process.env.NODE_ENV === 'development') {
        console.log('Featured projects loaded:', featuredProjects);
      }
      setProjects(featuredProjects);
    } catch (error: any) {
      console.error('Error loading featured projects:', error);
      toast.error(error.message || 'Failed to load featured projects');
    } finally {
      setLoading(false);
    }
  }, []); // 空依赖数组，因为函数不依赖任何外部变量

  // 使用 useEffect 的清理函数
  useEffect(() => {
    let mounted = true;

    const loadProjects = async () => {
      try {
        const featuredProjects = await projectService.getFeaturedProjects();
        if (mounted) {
          setProjects(featuredProjects);
        }
      } catch (error: any) {
        if (mounted) {
          console.error('Error loading featured projects:', error);
          toast.error(error.message || 'Failed to load featured projects');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProjects();

    // 清理函数
    return () => {
      mounted = false;
    };
  }, []); // 空依赖数组

  if (loading) {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-8">Featured Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-800 rounded-lg h-96"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-white mb-8">Featured Projects</h2>
        {projects.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-400 mb-2">No featured projects available at the moment.</p>
            <p className="text-sm text-gray-500">Check back later for exciting new projects!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}