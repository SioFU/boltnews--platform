import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectService } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import Comments from '../components/Comments';
import LikeButton from '../components/LikeButton';
import toast from 'react-hot-toast';
import { Eye, ExternalLink, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  user_id: string;
  created_at: string;
  view_count: number;
  status: 'pending' | 'approved' | 'featured' | 'rejected';
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      const data = await projectService.getProjectById(id!);
      setProject(data);
      // 增加浏览量
      await projectService.incrementViewCount(id!);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('加载项目失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">项目不存在</h1>
          <Link
            to="/projects"
            className="text-blue-500 hover:text-blue-600 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回项目列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 返回按钮 */}
        <Link
          to="/projects"
          className="text-gray-500 hover:text-gray-700 flex items-center mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回项目列表
        </Link>

        {/* 项目标题和元信息 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex items-center space-x-4">
              <LikeButton projectId={project.id} />
              <div className="flex items-center text-gray-500">
                <Eye className="w-5 h-5 mr-1" />
                <span>{project.view_count}</span>
              </div>
            </div>
          </div>

          {/* 项目描述 */}
          <p className="text-gray-600 mb-6 whitespace-pre-wrap">
            {project.description}
          </p>

          {/* 项目链接 */}
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-500 hover:text-blue-600"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            访问项目
          </a>

          {/* 项目元信息 */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                发布于{' '}
                {formatDistanceToNow(new Date(project.created_at), {
                  addSuffix: true,
                  locale: zhCN,
                })}
              </span>
              <div className="flex items-center space-x-4">
                {project.status === 'featured' && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    精选
                  </span>
                )}
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  已上架
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 评论区 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <Comments projectId={project.id} />
        </div>
      </div>
    </div>
  );
}
