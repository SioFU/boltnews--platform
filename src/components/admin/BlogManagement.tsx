import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { blogService } from '../../lib/supabase';
import type { BlogPost } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const allPosts = await blogService.getAllPosts();
      setPosts(allPosts);
    } catch (error) {
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await blogService.deletePost(postId);
      setPosts(posts.filter(p => p.id !== postId));
      toast.success('Post deleted successfully');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const handleNewPost = () => {
    navigate('/admin/blog/new');
  };

  const handleEdit = (postId: string) => {
    navigate(`/admin/blog/edit/${postId}`);
  };

  const handlePreview = (slug: string) => {
    window.open(`/blog/${slug}`, '_blank');
  };

  // 分页
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const currentPosts = posts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Blog Posts</h2>
        <button
          onClick={handleNewPost}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>New Post</span>
        </button>
      </div>

      <div className="w-full">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-[35%]">
                  Post
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-[15%]">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-[20%]">
                  Author
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-[15%]">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider w-[15%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {currentPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-800 transition-colors duration-200 cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 flex-shrink-0">
                        <img
                          className="h-12 w-12 rounded-lg object-cover transition-transform duration-200 group-hover:scale-105"
                          src={post.cover_image || 'https://placehold.co/100x100?text=No+Image'}
                          alt=""
                        />
                      </div>
                      <div className="ml-4 min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-200 truncate">{post.title}</div>
                        {post.excerpt && (
                          <div className="mt-1 text-sm text-gray-400 truncate max-w-md">{post.excerpt}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      post.status === 'published' 
                        ? 'bg-green-900/50 text-green-300'
                        : 'bg-yellow-900/50 text-yellow-300'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg overflow-hidden">
                        <img 
                          src={post.author?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'} 
                          alt={post.author?.name || 'Anonymous'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-300 truncate">
                        {post.author?.name || 'Anonymous'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {format(new Date(post.updated_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handlePreview(post.slug)}
                        className="p-1.5 rounded-full text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors duration-200"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(post.id)}
                        className="p-1.5 rounded-full text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors duration-200"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors duration-200"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页控件 */}
        <div className="mt-4 flex items-center justify-between px-4">
          <div className="text-sm text-gray-400">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, posts.length)} of {posts.length} posts
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-400">No blog posts found</h3>
          </div>
        )}
      </div>
    </div>
  );
}