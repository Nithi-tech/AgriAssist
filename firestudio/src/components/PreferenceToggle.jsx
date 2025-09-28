'use client';

import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const PreferenceToggle = ({ icon, title, description, defaultValue = false, onChange }) => {
  const [isEnabled, setIsEnabled] = useState(defaultValue);
  const { toast } = useToast();

  const handleToggle = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    
    if (onChange) {
      onChange(newValue);
    }

    toast({
      title: newValue ? '✅ Enabled' : '❌ Disabled',
      description: `${title} has been ${newValue ? 'turned on' : 'turned off'}`,
      duration: 2000,
    });
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border hover:border-green-200 group">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg transition-all duration-300 ${
          isEnabled 
            ? 'bg-green-100 text-green-600' 
            : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
        }`}>
          <span className="text-xl">{icon}</span>
        </div>
        <div>
          <h3 className={`font-semibold transition-colors duration-300 ${
            isEnabled ? 'text-green-700' : 'text-gray-900 group-hover:text-gray-700'
          }`}>
            {title}
          </h3>
          <p className={`text-sm transition-colors duration-300 ${
            isEnabled ? 'text-green-600' : 'text-gray-500'
          }`}>
            {description}
          </p>
        </div>
      </div>

      {/* Custom Toggle Switch */}
      <button
        onClick={handleToggle}
        className={`relative w-14 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-200 hover:scale-105 ${
          isEnabled 
            ? 'bg-green-500 shadow-lg shadow-green-200' 
            : 'bg-gray-300 hover:bg-gray-400'
        }`}
      >
        <div
          className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
            isEnabled ? 'translate-x-7' : 'translate-x-1'
          }`}
        >
          <span className="text-xs">
            {isEnabled ? '✓' : '○'}
          </span>
        </div>
      </button>
    </div>
  );
};

export default PreferenceToggle;
