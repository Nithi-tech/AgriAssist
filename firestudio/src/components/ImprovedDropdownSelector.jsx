'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Settings } from 'lucide-react';

// Generic options with placeholders
const options = [
  { code: 'option1', name: 'Option One', description: 'First choice available' },
  { code: 'option2', name: 'Option Two', description: 'Second choice available' },
  { code: 'option3', name: 'Option Three', description: 'Third choice available' },
  { code: 'option4', name: 'Option Four', description: 'Fourth choice available' },
  { code: 'option5', name: 'Option Five', description: 'Fifth choice available' },
  { code: 'option6', name: 'Option Six', description: 'Sixth choice available' },
  { code: 'option7', name: 'Option Seven', description: 'Seventh choice available' },
  { code: 'option8', name: 'Option Eight', description: 'Eighth choice available' },
];

const ImprovedDropdownSelector = ({ 
  onSelectionChange = () => {}, 
  defaultValue = 'option1',
  placeholder = 'Select an option...',
  label = 'Select Option'
}) => {
  const [currentSelection, setCurrentSelection] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get current selection details
  const getCurrentSelection = () => {
    return options.find(option => option.code === currentSelection) || options[0];
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectionChange = (optionCode) => {
    setCurrentSelection(optionCode);
    setIsOpen(false);
    onSelectionChange(optionCode);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const currentOption = getCurrentSelection();

  return (
    <div className="w-full max-w-md">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        {/* Selected Option Display */}
        <Button
          variant="outline"
          className="w-full justify-between p-4 h-auto bg-white hover:bg-gray-50 border-2 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md group"
          onClick={toggleDropdown}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                {currentOption.name}
              </div>
              <div className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">
                {currentOption.description}
              </div>
            </div>
          </div>
          <ChevronDown 
            className={`h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-all duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </Button>

        {/* Improved Dropdown List with all your requirements */}
        {isOpen && (
          <div 
            className="absolute top-full left-0 right-0 mt-2 z-[9999]"
            style={{ 
              background: 'white',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              borderRadius: '12px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              maxHeight: '320px',
              overflowY: 'auto'
            }}
            role="listbox"
            aria-label={label}
          >
            <div className="p-3">
              {options.map((option, index) => (
                <button
                  key={option.code}
                  className={`
                    w-full text-left px-4 py-3 rounded-lg transition-all duration-200 
                    flex items-center justify-between group
                    ${index === 0 ? 'rounded-t-lg' : ''}
                    ${index === options.length - 1 ? 'rounded-b-lg' : ''}
                    ${currentSelection === option.code 
                      ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                      : 'hover:bg-gray-50 hover:shadow-sm border border-transparent'
                    }
                  `}
                  onClick={() => handleSelectionChange(option.code)}
                  style={{
                    backgroundColor: currentSelection === option.code ? '#eff6ff' : 'white',
                    marginBottom: index === options.length - 1 ? '0' : '2px'
                  }}
                  onMouseEnter={(e) => {
                    if (currentSelection !== option.code) {
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.transform = 'translateX(2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentSelection !== option.code) {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.transform = 'translateX(0px)';
                    }
                  }}
                  role="option"
                  aria-selected={currentSelection === option.code}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <div>
                      <div className={`font-medium ${
                        currentSelection === option.code 
                          ? 'text-blue-700' 
                          : 'text-gray-900 group-hover:text-blue-600'
                      } transition-colors`}>
                        {option.name}
                      </div>
                      <div className={`text-sm ${
                        currentSelection === option.code 
                          ? 'text-blue-600' 
                          : 'text-gray-500 group-hover:text-blue-500'
                      } transition-colors`}>
                        {option.description}
                      </div>
                    </div>
                  </div>
                  {currentSelection === option.code && (
                    <Check className="h-5 w-5 text-blue-600 animate-in zoom-in-50 duration-200" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImprovedDropdownSelector;
