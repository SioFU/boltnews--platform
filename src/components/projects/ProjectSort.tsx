import React from 'react';
import { Clock, ThumbsUp } from 'lucide-react';

interface ProjectSortProps {
  value: 'latest' | 'popular';
  onChange: (value: 'latest' | 'popular') => void;
}

export default function ProjectSort({ value, onChange }: ProjectSortProps) {
  return (
    <div className="flex bg-gray-800 rounded-md">
      <button
        onClick={() => onChange('latest')}
        className={`flex items-center px-4 py-2 rounded-l-md ${
          value === 'latest'
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <Clock className="h-4 w-4 mr-2" />
        Latest
      </button>
      <button
        onClick={() => onChange('popular')}
        className={`flex items-center px-4 py-2 rounded-r-md ${
          value === 'popular'
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <ThumbsUp className="h-4 w-4 mr-2" />
        Popular
      </button>
    </div>
  );
}