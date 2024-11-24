import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { blogService } from '../../lib/supabase';
import type { BlogPost } from '../../types';
import toast from 'react-hot-toast';
import slugify from 'slugify';

export default function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<Partial<BlogPost>>({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft'
  });

  useEffect(() => {
    if (id) {
      loadPost();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadPost = async () => {
    try {
      const loadedPost = await blogService.getPost(id);
      if (loadedPost) {
        setPost(loadedPost);
      } else {
        toast.error('Post not found');
        navigate('/admin');
      }
    } catch (error) {
      toast.error('Failed to load post');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post.title || !post.content) {
      toast.error('Title and content are required');
      return;
    }

    setSaving(true);
    try {
      const postData = {
        ...post,
        slug: slugify(post.title, { lower: true, strict: true })
      };

      if (id) {
        await blogService.updatePost(id, postData);
        toast.success('Post updated successfully');
      } else {
        await blogService.createPost(postData);
        toast.success('Post created successfully');
      }
      navigate('/admin');
    } catch (error) {
      toast.error('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPost(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-900 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-white mb-6">
            {id ? 'Edit Post' : 'New Post'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-400">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={post.title}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-400">
                Excerpt
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                value={post.excerpt}
                onChange={handleChange}
                rows={2}
                className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-400">
                Content
              </label>
              <textarea
                id="content"
                name="content"
                value={post.content}
                onChange={handleChange}
                rows={15}
                className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-400">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={post.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 ${
                  saving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
