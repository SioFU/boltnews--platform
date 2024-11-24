import React, { useState, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import AuthModal from './auth/AuthModal';

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (user) {
      navigate(`/user/${user.id}`);
    }
  };

  const handleAuthClose = () => {
    setShowAuthModal(false);
  };

  return (
    <Fragment>
      <nav className="fixed top-0 w-full bg-black/90 backdrop-blur-sm border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0">
                <span className="text-2xl font-bold text-white">bolt<span className="text-blue-500">news</span></span>
              </Link>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <Link to="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Home</Link>
                  <Link to="/projects" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Projects</Link>
                  <Link to="/blog" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Blog</Link>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-4">
                {user ? (
                  <div className="relative group">
                    <button
                      className="flex items-center p-1 rounded-full hover:bg-gray-800/50 transition-colors duration-150"
                    >
                      <img
                        src={profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || '')}`}
                        alt={profile?.name || user.email || ''}
                        className="h-8 w-8 rounded-full"
                      />
                    </button>
                    {/* Dropdown menu */}
                    <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-gray-900/95 backdrop-blur-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out py-1">
                      <div className="px-4 py-3 border-b border-gray-800">
                        <p className="text-sm text-gray-300 truncate">Signed in as</p>
                        <p className="text-sm font-medium text-white truncate">{profile?.name || user.email}</p>
                      </div>
                      <div className="py-1">
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 flex items-center space-x-2 transition-colors duration-150"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Admin Dashboard</span>
                          </Link>
                        )}
                        <button
                          onClick={handleProfileClick}
                          className="w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 flex items-center space-x-2 transition-colors duration-150"
                        >
                          <User className="h-4 w-4" />
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            signOut();
                            navigate('/');
                          }}
                          className="w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-800/50 flex items-center space-x-2 transition-colors duration-150"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="text-gray-300 hover:text-white flex items-center space-x-1"
                  >
                    <User className="h-5 w-5" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </div>
            <div className="md:hidden">
              <button className="text-gray-300 hover:text-white">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      {/* 登录弹窗 */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={handleAuthClose}
        />
      )}
    </Fragment>
  );
}
