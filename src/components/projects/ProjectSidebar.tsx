import React, { useState, useEffect } from 'react';
import { Tag, Menu, X } from 'lucide-react';

export const PROJECT_CATEGORIES = [
  { id: 'productivity', label: 'Productivity', icon: '⚡' },
  { id: 'communication', label: 'Communication', icon: '💬' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎮' },
  { id: 'e-commerce', label: 'E-commerce', icon: '🛍️' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'social-networking', label: 'Social Networking', icon: '🤝' },
  { id: 'health-fitness', label: 'Health & Fitness', icon: '💪' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'news-media', label: 'News & Media', icon: '📰' },
  { id: 'others', label: 'Others', icon: '🔮' }
] as const;

interface ProjectSidebarProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

export default function ProjectSidebar({ selectedCategories, onCategoryChange }: ProjectSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // 处理ESC键关闭侧边栏
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const toggleCategory = (categoryId: string) => {
    if (categoryId === 'all') {
      onCategoryChange([]);
      return;
    }
    
    if (selectedCategories.includes(categoryId)) {
      onCategoryChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  const sidebarContent = (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Tag className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-white">Categories</h2>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => {
            onCategoryChange([]);
            setIsOpen(false);
          }}
          className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
            selectedCategories.length === 0
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <span className="mr-2">🌟</span>
          <span>All Projects</span>
        </button>

        {PROJECT_CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => {
              toggleCategory(category.id);
              setIsOpen(false);
            }}
            className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
              selectedCategories.includes(category.id)
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="mr-2">{category.icon}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* 移动端菜单按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 lg:hidden z-30 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 w-72 lg:w-auto transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transition-transform duration-300 ease-in-out z-50 lg:z-0 h-full lg:h-auto overflow-y-auto bg-gray-950 lg:bg-transparent lg:overflow-visible`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}