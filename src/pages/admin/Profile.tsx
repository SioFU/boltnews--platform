import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export default function AdminProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!user) {
          navigate('/admin-login');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        if (data.role !== 'admin') {
          toast.error('只有管理员才能访问此页面');
          navigate('/');
          return;
        }

        setProfile(data);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-500" />
            <h1 className="text-2xl font-bold text-white">Admin Profile</h1>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-800 flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400">Name</label>
                  <div className="mt-1 text-white">{profile.name}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400">Email</label>
                  <div className="mt-1 text-white">{profile.email}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400">Role</label>
                  <div className="mt-1 text-white">{profile.role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
