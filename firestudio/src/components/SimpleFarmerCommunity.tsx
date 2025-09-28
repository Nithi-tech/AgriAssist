'use client';

import React from 'react';

// Simple fallback component for testing
export default function SimpleFarmerCommunity() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Farmer Community
        </h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 mb-4">
            Welcome to the Farmer Community! This is a temporary placeholder 
            while we fix the component import issue.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              🚧 The community feature is temporarily under maintenance. 
              Please check back soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
