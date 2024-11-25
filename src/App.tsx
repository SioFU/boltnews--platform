import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProfile from './pages/admin/Profile';
import { UserProfile } from './pages/UserProfile';
import { useAuthStore } from './store/authStore';
import { initializeSupabase } from './lib/supabase';
import LoadingSpinner from './components/LoadingSpinner';
import ProjectUploadForm from './components/upload/ProjectUploadForm';
import ProtectedRoute from './components/ProtectedRoute';
import AddSampleProjects from './pages/AddSampleProjects';
import AdminLogin from './pages/AdminLogin';
import AdminSignup from './pages/AdminSignup';
import BlogEditor from './pages/admin/BlogEditor';
import { initGA, logPageView } from './lib/analytics';

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export default function App() {
  const { initialize, loading: authLoading } = useAuthStore();
  const [dbInitialized, setDbInitialized] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isUploadFormVisible, setIsUploadFormVisible] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        console.log('Starting app initialization...');
        
        // 初始化 GA
        if (MEASUREMENT_ID) {
          console.log('Initializing Google Analytics...');
          initGA(MEASUREMENT_ID);
          console.log('Google Analytics initialized');
        } else {
          console.warn('Google Analytics Measurement ID not found');
        }

        // 初始化 Auth
        console.log('Initializing auth...');
        await initialize();
        console.log('Auth initialized');

        // 初始化数据库
        console.log('Initializing database...');
        const initialized = await initializeSupabase();
        setDbInitialized(initialized);
        
        if (!initialized) {
          console.error('Database initialization failed');
        } else {
          console.log('Database initialized successfully');
        }

        setInitialized(true);
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setInitializing(false);
      }
    };

    init();
  }, [initialize]);

  const handleOpenUploadForm = () => {
    setIsUploadFormVisible(true);
  };

  const handleCloseUploadForm = () => {
    setIsUploadFormVisible(false);
  };

  function RouteTracker() {
    const location = useLocation();
    
    useEffect(() => {
      logPageView();
    }, [location]);
    
    return null;
  }

  if (initializing || authLoading || !initialized) {
    console.log('App is loading...', { initializing, authLoading });
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Router>
      <RouteTracker />
      <div className="min-h-screen bg-gray-950">
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#fff',
              borderRadius: '0.5rem',
              padding: '1rem',
            },
          }}
        />
        <Navbar onUploadClick={handleOpenUploadForm} />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute requireAdmin>
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/profile" element={<AdminProfile />} />
                  <Route path="/add-sample-projects" element={<AddSampleProjects />} />
                  <Route path="/blog/new" element={<BlogEditor />} />
                  <Route path="/blog/edit/:id" element={<BlogEditor />} />
                </Routes>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user/:userId" 
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } 
          />
          <Route path="/admin-signup" element={<AdminSignup />} />
          <Route path="/admin-login" element={<AdminLogin />} />
        </Routes>

        <Footer />
        {isUploadFormVisible && <ProjectUploadForm onClose={handleCloseUploadForm} />}
      </div>
    </Router>
  );
}