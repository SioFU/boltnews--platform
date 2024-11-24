import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectManagement from '../../components/admin/ProjectManagement';
import BlogManagement from '../../components/admin/BlogManagement';
import { Shield, LayoutDashboard, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminService, supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('projects');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        console.log('=== Admin Dashboard Debug ===');
        console.log('1. Starting admin check...');

        // 检查用户是否已登录
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error('Auth error:', authError);
          toast.error('Authentication failed');
          navigate('/');
          return;
        }

        if (!user) {
          console.log('No user found');
          toast.error('Please login first');
          navigate('/');
          return;
        }

        console.log('2. User found:', user.id);

        // 检查用户是否是管理员
        const isAdmin = await adminService.isAdmin();
        console.log('3. Admin check result:', isAdmin);

        if (!isAdmin) {
          console.log('4. User is not admin');
          toast.error('Unauthorized access');
          navigate('/');
          return;
        }

        console.log('5. Admin access confirmed');
        setLoading(false);
      } catch (error) {
        console.error('Error in admin check:', error);
        toast.error('Failed to verify admin status');
        navigate('/');
      }
    };

    checkAdminStatus();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3 mb-8">
          <Shield className="h-8 w-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'projects'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Projects</span>
            </button>
            <button
              onClick={() => setActiveTab('blog')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'blog'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Blog</span>
            </button>
          </div>

          <div className="transition-all duration-200">
            {activeTab === 'projects' && <ProjectManagement />}
            {activeTab === 'blog' && <BlogManagement />}
          </div>
        </div>
      </div>
    </div>
  );
}