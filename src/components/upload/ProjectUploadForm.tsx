import React, { useState, useEffect } from 'react';
import { PROJECT_CATEGORIES } from '../projects/ProjectSidebar';
import { useAuthStore } from '../../store/authStore';
import { projectService } from '../../lib/supabase';
import { X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface Project {
  name: string;
  description: string;
  project_url: string;
  thumbnail_url: string | null;
  categories: string[];
}

interface ProjectSubmission {
  name: string;
  description: string;
  project_url: string;
  thumbnail_url: string | null;
  categories: string[];
}

interface ProjectUploadFormProps {
  onClose?: () => void;
  onSuccess?: (data: any) => void;
  initialData?: Project;
}

const ProjectUploadForm: React.FC<ProjectUploadFormProps> = ({
  onClose,
  onSuccess,
  initialData
}) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Project>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    project_url: initialData?.project_url || '',
    thumbnail_url: initialData?.thumbnail_url || null,
    categories: initialData?.categories || []
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. 验证文件类型和大小
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only PNG, JPEG, GIF and WebP images are allowed.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 5MB.');
      return;
    }

    // 2. 创建本地预览
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setUploadedImage(reader.result as string);  // 仅用于预览
      }
    };
    reader.readAsDataURL(file);

    // 3. 保存文件对象等待提交
    setSelectedFile(file);
    setFormData(prev => ({ ...prev, thumbnail_url: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login first');
      return;
    }

    try {
      if (formData.categories.length === 0) {
        toast.error('Please select at least one category');
        return;
      }

      setLoading(true);

      // 1. 处理图片上传
      let finalImageUrl = formData.thumbnail_url;
      if (selectedFile) {
        const { data: imageUrl, error: uploadError } = await projectService.uploadProjectImage(selectedFile);
        
        if (uploadError) {
          console.error('Image upload error:', uploadError);
          toast.error(uploadError.message || 'Failed to upload image');
          return;
        }
        
        if (!imageUrl) {
          toast.error('Failed to get image URL');
          return;
        }

        finalImageUrl = imageUrl;
      }

      // 2. 准备项目数据
      const projectData: ProjectSubmission = {
        ...formData,
        thumbnail_url: finalImageUrl
      };

      // 3. 提交或更新项目
      const { data, error } = initialData?.id
        ? await projectService.updateProject(initialData.id, projectData)
        : await projectService.submitProject(projectData);

      if (error) throw error;

      toast.success(initialData ? 'Project updated successfully!' : 'Project submitted successfully!');
      
      if (onSuccess) onSuccess(data);
      if (onClose) onClose();
    } catch (error: any) {
      console.error('Error in project operation:', error);
      toast.error(error.message || 'Failed to process project');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData((prev) => {
      const categories = prev.categories.includes(categoryId)
        ? prev.categories.filter((cat) => cat !== categoryId)
        : [...prev.categories, categoryId];
      return { ...prev, categories };
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl relative shadow-lg max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          disabled={loading}
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold text-white mb-6">{initialData ? 'Edit Project' : 'Share Your Project'}</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Enter your project name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Categories *
            </label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryChange(category.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${formData.categories.includes(category.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                    }`}
                >
                  {category.icon} {category.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1.5">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={5}
              className="block w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
              placeholder="Describe your project..."
              required
            />
          </div>

          <div>
            <label htmlFor="project_url" className="block text-sm font-medium text-gray-300 mb-1.5">
              Project URL *
            </label>
            <input
              type="url"
              id="project_url"
              name="project_url"
              value={formData.project_url}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="https://..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Project Image
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-400
                    file:mr-3 file:py-1.5 file:px-3
                    file:rounded-md file:border file:border-gray-600
                    file:text-sm file:font-medium
                    file:bg-gray-700 file:text-white
                    hover:file:bg-gray-600 file:transition-colors
                    cursor-pointer"
                />
                <p className="mt-1 text-xs text-gray-400">Recommended: 1200x630px, PNG or JPG</p>
              </div>
              {(uploadedImage || formData.thumbnail_url) && (
                <div className="flex-shrink-0">
                  <img
                    src={uploadedImage || formData.thumbnail_url}
                    alt="Project preview"
                    className="h-16 w-16 object-cover rounded-md border border-gray-600"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-600 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors inline-flex items-center disabled:opacity-70"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className="animate-spin -ml-0.5 mr-2 h-4 w-4" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectUploadForm;
