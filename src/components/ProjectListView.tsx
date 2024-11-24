import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { FiEdit2, FiTrash2, FiExternalLink, FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface ProjectListViewProps {
  projects: Project[];
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  isOwner?: boolean;
}

const ProjectListView: React.FC<ProjectListViewProps> = ({
  projects,
  onEdit,
  onDelete,
  isOwner = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    sort: '' as '' | 'likes' | 'comments' | 'created_at',
    sortDirection: 'desc' as 'asc' | 'desc'
  });

  // 获取所有可用的分类
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    projects.forEach(project => {
      project.categories?.forEach(category => categories.add(category));
    });
    return Array.from(categories).sort();
  }, [projects]);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // 应用过滤和排序
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // 应用状态过滤
    if (filters.status) {
      result = result.filter(project => project.status === filters.status);
    }

    // 应用分类过滤
    if (filters.category) {
      result = result.filter(project => 
        project.categories?.includes(filters.category)
      );
    }

    // 应用排序
    if (filters.sort) {
      result.sort((a, b) => {
        if (filters.sort === 'created_at') {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return filters.sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
        }
        const aValue = a[filters.sort] || 0;
        const bValue = b[filters.sort] || 0;
        return filters.sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
      });
    }

    return result;
  }, [projects, filters]);

  // 分页
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const currentProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field: 'likes' | 'comments' | 'created_at') => {
    setFilters(prev => ({
      ...prev,
      sort: field,
      sortDirection: prev.sort === field && prev.sortDirection === 'desc' ? 'asc' : 'desc'
    }));
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-[35%]">
                Project
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-[15%]">
                <div className="flex items-center space-x-2">
                  <span>Status</span>
                  <select
                    className="ml-2 bg-gray-700 text-gray-300 text-xs rounded border-none focus:ring-2 focus:ring-blue-500"
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">All</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-[15%]">
                <div className="flex items-center space-x-2">
                  <span>Categories</span>
                  <select
                    className="ml-2 bg-gray-700 text-gray-300 text-xs rounded border-none focus:ring-2 focus:ring-blue-500"
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">All</option>
                    {allCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-[15%]">
                <div className="flex items-center justify-between">
                  <span>Date</span>
                  <button
                    onClick={() => handleSort('created_at')}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                    title="Sort by date"
                  >
                    {filters.sort === 'created_at' && (
                      filters.sortDirection === 'desc' ? <FiChevronDown className="inline" /> : <FiChevronUp className="inline" />
                    )}
                  </button>
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-[10%]">
                Engagement
              </th>
              {isOwner && (
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider w-[10%]">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {currentProjects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-800 transition-colors duration-200 cursor-pointer group">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 flex-shrink-0">
                      <img
                        className="h-12 w-12 rounded-lg object-cover transition-transform duration-200 group-hover:scale-105"
                        src={project.thumbnail_url || 'https://placehold.co/100x100?text=No+Image'}
                        alt=""
                      />
                    </div>
                    <div className="ml-4 min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-200 truncate">{project.name}</div>
                      <div className="mt-1 text-sm text-gray-400 truncate max-w-md">{project.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                    ${project.status === 'approved' ? 'bg-green-900/50 text-green-300' : 
                      project.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' : 
                      'bg-red-900/50 text-red-300'}`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                    {project.categories?.slice(0, 2).map((category, index) => (
                      <span
                        key={index}
                        className="px-2.5 py-1 text-xs rounded-full bg-gray-800/80 text-gray-300 border border-gray-700/50"
                      >
                        {category}
                      </span>
                    ))}
                    {project.categories && project.categories.length > 2 && (
                      <span className="px-2.5 py-1 text-xs rounded-full bg-gray-800/80 text-gray-400">
                        +{project.categories.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {formatDate(project.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-400">👍</span>
                      <span className="text-sm font-medium text-gray-300">{project.likes || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-400">💬</span>
                      <span className="text-sm font-medium text-gray-300">{project.comments || 0}</span>
                    </div>
                  </div>
                </td>
                {isOwner && (
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <a
                        href={project.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors duration-200"
                      >
                        <FiExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(project);
                        }}
                        className="p-1.5 rounded-full text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors duration-200"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(project);
                        }}
                        className="p-1.5 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors duration-200"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页控件 */}
      <div className="mt-4 flex items-center justify-between px-4">
        <div className="text-sm text-gray-400">
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)} of {filteredProjects.length} projects
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={i}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectListView;
