import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import CommentForm from './CommentForm';
import CommentList from './CommentList';
import type { Comment } from '../../types';
import toast from 'react-hot-toast';

interface CommentSectionProps {
  projectId: string;
}

export default function CommentSection({ projectId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchComments();
  }, [projectId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(name, avatar)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (content: string) => {
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content,
          project_id: projectId,
          user_id: user.id,
        })
        .select(`
          *,
          user:users(name, avatar)
        `)
        .single();

      if (error) throw error;
      setComments([data, ...comments]);
      toast.success('Comment added successfully');
    } catch (error: any) {
      toast.error('Failed to add comment');
    }
  };

  return (
    <div className="space-y-6">
      <CommentForm onSubmit={handleAddComment} />
      <CommentList comments={comments} loading={loading} />
    </div>
  );
}