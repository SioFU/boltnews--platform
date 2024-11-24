import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { projectService } from '../lib/supabase';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    email: string;
  };
}

interface CommentsProps {
  projectId: string;
}

export default function Comments({ projectId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadComments();
  }, [projectId]);

  const loadComments = async () => {
    try {
      const data = await projectService.getProjectComments(projectId);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('加载评论失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('请先登录');
      return;
    }
    if (!newComment.trim()) {
      toast.error('请输入评论内容');
      return;
    }

    setIsLoading(true);
    try {
      await projectService.addComment(projectId, newComment);
      toast.success('评论成功');
      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('评论失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">评论</h3>
      
      {/* 评论列表 */}
      <div className="space-y-4 mb-6">
        {comments.length === 0 ? (
          <p className="text-gray-500">暂无评论</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">
                  {comment.user.email.split('@')[0]}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </span>
              </div>
              <p className="text-gray-600">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      {/* 评论表单 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? "写下你的评论..." : "请登录后评论"}
            disabled={!user || isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            rows={3}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!user || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? '提交中...' : '发表评论'}
          </button>
        </div>
      </form>
    </div>
  );
}
