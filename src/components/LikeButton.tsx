import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { projectService } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Heart } from 'lucide-react';

interface LikeButtonProps {
  projectId: string;
}

export default function LikeButton({ projectId }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadLikeStatus();
  }, [projectId, user]);

  const loadLikeStatus = async () => {
    try {
      if (user) {
        const hasLiked = await projectService.hasUserLiked(projectId);
        setIsLiked(hasLiked);
      }
      const count = await projectService.getProjectLikes(projectId);
      setLikeCount(count || 0);
    } catch (error) {
      console.error('Error loading like status:', error);
    }
  };

  const handleLikeClick = async () => {
    if (!user) {
      toast.error('Please sign in to like');
      return;
    }

    setIsLoading(true);
    try {
      if (isLiked) {
        await projectService.unlikeProject(projectId);
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
        toast.success('Like removed');
      } else {
        await projectService.likeProject(projectId);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
        toast.success('Project liked');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLikeClick}
      disabled={isLoading || !user}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        isLiked
          ? 'text-red-500 hover:text-red-600'
          : 'text-gray-500 hover:text-gray-600'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Heart
        className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
      />
      <span>{likeCount}</span>
    </button>
  );
}
