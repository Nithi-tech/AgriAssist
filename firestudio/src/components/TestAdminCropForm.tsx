'use client';

import React from 'react';
import { Crop } from '@/lib/cropApi';

interface TestAdminCropFormProps {
  onCropAdded?: (crop: Crop) => void;
}

const TestAdminCropForm: React.FC<TestAdminCropFormProps> = ({ onCropAdded }) => {
  return (
    <div className="p-4 border border-gray-300 rounded-md">
      <h2 className="text-xl font-bold mb-4">Test Admin Crop Form</h2>
      <p>This is a test component to verify export/import works correctly.</p>
      <button 
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => {
          console.log('Test button clicked');
          onCropAdded?.({ id: 'test-crop-id' } as Crop);
        }}
      >
        Test Add Crop
      </button>
    </div>
  );
};

export default TestAdminCropForm;
