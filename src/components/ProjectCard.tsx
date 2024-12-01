import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { FiEdit2, FiTrash2, FiExternalLink } from 'react-icons/fi';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { trackUserBehavior } from '../lib/analytics';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onLike?: (project: Project) => void;
  variant?: 'default' | 'feature';
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  onLike,
  variant = 'default'
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(project.likes || 0);

  const statusColors = {
    approved: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const getPlaceholderColor = (title: string) => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-purple-600',
      'bg-gradient-to-br from-green-500 to-teal-600',
      'bg-gradient-to-br from-orange-500 to-red-600',
      'bg-gradient-to-br from-pink-500 to-rose-600',
      'bg-gradient-to-br from-indigo-500 to-blue-600'
    ];
    const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const renderImage = () => {
    // 验证 thumbnail_url 是否为有效的 URL
    const isValidUrl = (url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    if (!project.thumbnail_url || !isValidUrl(project.thumbnail_url) || imageError) {
      return (
        <div className={`w-full h-full ${getPlaceholderColor(project.name)} flex items-center justify-center`}>
          <span className="text-white text-xl font-bold opacity-50">
            {project.name.charAt(0).toUpperCase()}
          </span>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        <img
          src={project.thumbnail_url}
          alt={project.name}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => {
            setImageLoading(false);
            setImageError(false);
          }}
          onError={() => {
            console.error(`Failed to load image: ${project.thumbnail_url}`);
            setImageLoading(false);
            setImageError(true);
          }}
        />
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        )}
      </div>
    );
  };

  // 获取最新的点赞数
  const fetchLikes = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('likes')
        .eq('id', project.id)
        .single();
      
      if (error) throw error;
      if (data) {
        setLikeCount(data.likes || 0);
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };

  useEffect(() => {
    fetchLikes();
  }, [project.id]);

  const handleProjectClick = (e: React.MouseEvent) => {
    trackUserBehavior.projectView(project.id, project.name);
    console.log('Project URL:', project.project_url);
    if (project.project_url) {
      try {
        window.open(project.project_url, '_blank');
      } catch (error) {
        console.error('Error opening project URL:', error);
      }
    } else {
      console.warn('No project URL available');
    }
  };

  return (
    <article 
      className="bg-gray-900 rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
    >
      <div 
        className="relative aspect-video cursor-pointer"
        onClick={handleProjectClick}
      >
        {renderImage()}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-2 right-2">
          {(onEdit || onDelete) && (
            <div className="flex items-center space-x-2" role="group" aria-label="Project actions">
              {project.project_url && (
                <a
                  href={project.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-900/50 rounded-full text-gray-200 hover:bg-gray-900/80 transition-colors"
                  aria-label="Visit project website"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FiExternalLink className="w-5 h-5" />
                </a>
              )}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(project);
                  }}
                  className="p-2 bg-gray-900/50 rounded-full text-gray-200 hover:bg-gray-900/80 transition-colors"
                  aria-label="Edit project"
                >
                  <FiEdit2 className="w-5 h-5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project);
                  }}
                  className="p-2 bg-gray-900/50 rounded-full text-gray-200 hover:bg-gray-900/80 transition-colors"
                  aria-label="Delete project"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div 
            className="group flex items-center space-x-2 min-w-0"
          >
            <div className="relative shrink-0">
              {project.user?.avatar_url ? (
                <div className="relative">
                  <img
                    src={project.user.avatar_url}
                    alt={project.user.username || 'User'}
                    className="w-6 h-6 rounded-full object-cover border border-gray-700/50"
                  />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-400 truncate">
                {project.user?.username || 'Anonymous'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-200">
            {project.name}
          </h2>
          <div className="relative">
            <p 
              className={`text-gray-400 text-sm ${
                isDescriptionExpanded ? '' : 'line-clamp-2'
              }`}
            >
              {project.description}
            </p>
            {project.description.length > 100 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDescriptionExpanded(!isDescriptionExpanded);
                }}
                className="text-blue-400 text-xs mt-1 hover:text-blue-300 transition-colors"
              >
                {isDescriptionExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 items-center">
                {(isTagsExpanded ? project.categories : project.categories?.slice(0, 1))?.map(
                  (category, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300 whitespace-nowrap"
                    >
                      {category}
                    </span>
                  )
                )}
                {!isTagsExpanded && project.categories && project.categories.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsTagsExpanded(true);
                    }}
                    className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    +{project.categories.length - 1}
                  </button>
                )}
                {isTagsExpanded && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsTagsExpanded(false);
                    }}
                    className="text-blue-400 text-xs hover:text-blue-300 transition-colors"
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <motion.button
                onClick={async (e) => {
                  e.stopPropagation();
                  const newLikedState = !isLiked;
                  
                  // 更新本地状态
                  setIsLiked(newLikedState);
                  setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
                  
                  try {
                    // 使用 RPC 调用来更新点赞数
                    const { error } = await supabase
                      .rpc('increment_likes', { 
                        project_id: project.id,
                        increment: newLikedState ? 1 : -1
                      });

                    if (error) throw error;
                    trackUserBehavior.projectLike(project.id);
                  } catch (error) {
                    console.error('Error updating likes:', error);
                    // 如果失败，恢复状态
                    setIsLiked(!newLikedState);
                    setLikeCount(prev => newLikedState ? prev - 1 : prev + 1);
                  }
                }}
                className={`flex items-center space-x-1 group ${
                  isLiked ? 'text-pink-500' : 'hover:text-pink-500'
                } transition-colors`}
                whileTap={{ scale: 0.9 }}
              >
                <motion.span
                  animate={isLiked ? {
                    scale: [1, 1.2, 0.95, 1],
                    transition: { duration: 0.35 }
                  } : {}}
                >
                  {isLiked ? '❤️' : '🤍'}
                </motion.span>
                <AnimatePresence>
                  <motion.span
                    key={likeCount}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {likeCount}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
              <span className="flex items-center space-x-1">
                <span>💬</span>
                <span>{project.comments || 0}</span>
              </span>
            </div>
            {project.user?.website && (
              <a
                href={project.user.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-blue-400 transition-colors p-1 hover:bg-blue-500/10 rounded-full"
                onClick={(e) => e.stopPropagation()}
              >
                <FiExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;