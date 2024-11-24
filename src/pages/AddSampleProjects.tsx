import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function AddSampleProjects() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const addProjects = async () => {
      if (isDone) return;
      
      setIsLoading(true);
      try {
        await projectService.addSampleProjects();
        toast.success('Sample projects added successfully');
        setIsDone(true);
        // Redirect to admin panel after 3 seconds
        setTimeout(() => {
          navigate('/admin');
        }, 3000);
      } catch (error: any) {
        console.error('Error:', error);
        toast.error(error.message || 'Failed to add sample projects');
      } finally {
        setIsLoading(false);
      }
    };

    addProjects();
  }, [isDone, navigate]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Add Sample Projects
          </h2>
          
          {isLoading ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              <p className="text-lg text-gray-600">Adding sample projects...</p>
            </div>
          ) : isDone ? (
            <div className="space-y-4">
              <p className="text-xl text-green-600 font-semibold">
                Sample projects added successfully!
              </p>
              <p className="text-gray-600">
                Redirecting to admin panel in 3 seconds...
              </p>
              <button
                onClick={() => navigate('/admin')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Return to Admin Panel
              </button>
            </div>
          ) : (
            <p className="text-lg text-gray-600">
              Preparing to add sample projects...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
