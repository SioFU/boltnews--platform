import React from 'react';
import type { Comment } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface CommentListProps {
  comments: Comment[];
  loading: boolean;
}

export default function CommentList({ comments, loading }: CommentListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gray-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-1/4" />
                <div className="h-4 bg-gray-700 rounded w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No comments yet. Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment.id} className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <img
              src={comment.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user.name)}`}
              alt={comment.user.name}
              className="h-8 w-8 rounded-full"
            />
            <div>
              <h4 className="text-white font-medium">{comment.user.name}</h4>
              <p className="text-sm text-gray-400">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <p className="text-gray-300 whitespace-pre-wrap">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}