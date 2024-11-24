import React from 'react';
import { useEffect, useState } from 'react';
import { blogService } from '../lib/supabase';
import { Link } from 'react-router-dom';
import type { BlogPost } from '../types';
import { Calendar, Tag, User } from 'lucide-react';
import { format } from 'date-fns';

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await blogService.getAllPosts();
      setPosts(data.filter(p => p.status === 'published'));
    } catch (error) {
      console.error('Error loading blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Blog</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article key={post.id} className="bg-gray-900 rounded-lg overflow-hidden hover:transform hover:scale-[1.02] transition-all">
              {post.coverImage && (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <Link to={`/blog/${post.slug}`}>
                  <h2 className="text-xl font-bold text-white hover:text-blue-500 transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                </Link>
                
                <div className="flex items-center mt-4 space-x-4 text-sm text-gray-400">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(new Date(post.createdAt), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {post.author.name}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="mt-4 text-gray-300 line-clamp-3">{post.excerpt}</p>
                
                <Link
                  to={`/blog/${post.slug}`}
                  className="inline-flex items-center mt-4 text-blue-500 hover:text-blue-400"
                >
                  Read more
                  <svg
                    className="ml-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12 bg-gray-900 rounded-lg">
            <p className="text-gray-400">No blog posts found</p>
          </div>
        )}
      </div>
    </div>
  );
}