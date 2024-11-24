      import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  onClose,
  onUpdate,
}) => {
  const [name, setName] = useState(user.name || '');
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateProfile = useAuthStore(state => state.updateProfile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 使用 authStore 的 updateProfile 方法更新用户资料
      await updateProfile({
        name: name,
        avatar: tempAvatar || user.avatar,
      });

      const updatedUser = {
        ...user,
        name: name,
        avatar: tempAvatar || user.avatar,
      };
      
      onUpdate(updatedUser);
      toast.success('Profile updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true);

      // 1. Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { 
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. 只设置临时头像，不更新数据库
      setTempAvatar(publicUrl);
      toast.success('Avatar uploaded. Click Save Changes to update your profile.');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    const file = e.target.files[0];

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('File size should be less than 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    await uploadAvatar(file);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-gradient-to-b from-gray-900 to-gray-800 w-full max-w-md mx-4 rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-6">Edit Profile</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center space-y-4">
                <motion.div 
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <img
                    src={tempAvatar || user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                    alt={user.name || 'User'}
                    className="w-32 h-32 rounded-full object-cover border-2 border-gray-700 group-hover:border-blue-500 transition-colors duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 rounded-full p-3 shadow-lg transform transition-all duration-200 hover:scale-110"
                  >
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </motion.div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-sm text-gray-400">
                  Click the camera icon to change your avatar
                </p>
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-lg bg-gray-800/50 border border-gray-700 text-gray-100 px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors duration-200"
                  placeholder="Enter your name"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4">
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={uploading || (name === user.name && !tempAvatar)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-6 py-2 text-sm font-medium text-white rounded-lg shadow-lg shadow-blue-500/20 transition-all duration-200 ${
                    name === user.name && !tempAvatar
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  Save Changes
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
