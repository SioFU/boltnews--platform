import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import ProjectUploadForm from './upload/ProjectUploadForm';
import { useAuthStore } from '../store/authStore';
import AuthModal from './auth/AuthModal';

export default function HeroSection() {
  const { user } = useAuthStore();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleUploadClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowUploadModal(true);
    }
  };

  // 当用户登录后自动打开上传表单
  React.useEffect(() => {
    if (user && showAuthModal) {
      setShowAuthModal(false);
      setShowUploadModal(true);
    }
  }, [user, showAuthModal]);

  return (
    <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
          Bolt AI - Discover AI-Powered<br />Web Applications
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Explore amazing projects built with AI assistance. Share your creations and get inspired by the community.
        </p>
        <button
          onClick={handleUploadClick}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105"
        >
          <Upload className="h-5 w-5 mr-2" />
          Share Your Project
        </button>
      </div>

      {/* 项目上传模态框 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white p-6 rounded-lg relative max-w-3xl w-full mx-4">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <ProjectUploadForm onClose={() => setShowUploadModal(false)} />
          </div>
        </div>
      )}

      {/* 登录模态框 */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </section>
  );
}
