import React from 'react';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogService } from '../lib/supabase';
import type { BlogPost } from '../types';
import { Calendar, Tag, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadPost(slug);
    }
  }, [slug]);

  const loadPost = async (slug: string) => {
    try {
      const data = await blogService.getPost(slug);
      setPost(data);
    } catch (error) {
      console.error('Error loading blog post:', error);
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

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-950 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-white">Post not found</h1>
          <Link to="/blog" className="text-blue-500 hover:text-blue-400 mt-4 inline-block">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/blog" className="text-blue-500 hover:text-blue-400 flex items-center mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Link>

        <article>
          {post.coverImage && (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-64 object-cover rounded-lg mb-8"
            />
          )}
          <h1 className="text-4xl font-bold text-white mb-4">{post.title}</h1>
          <div className="flex items-center space-x-4 mb-8 text-sm text-gray-400">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {format(new Date(post.createdAt), 'MMM d, yyyy')}
            </div>
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-1" />
              {post.tags.join(', ')}
            </div>
          </div>
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  );
}