import React from 'react';
import { Tag } from 'lucide-react';

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

  return (
    <aside className="w-72 flex-shrink-0">
      <div className="bg-gray-900 rounded-lg p-6 sticky top-24">
        <div className="flex items-center space-x-2 mb-6">
          <Tag className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-white">Categories</h2>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => onCategoryChange([])}
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
              onClick={() => toggleCategory(category.id)}
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
    </aside>
  );
}