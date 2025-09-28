'use client';

import React from 'react';
import MarketPricesDashboard from '@/components/market-prices-dashboard';

export default function MarketPricesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 via-white to-yellow-50/30">
      {/* Enhanced Header */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-100 to-orange-100 px-6 py-3 rounded-full border border-amber-200">
          <span className="text-3xl">💰</span>
          <h1 className="text-3xl font-bold text-amber-800">Market Prices</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Real-time agricultural commodity prices to help you make informed selling decisions
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-amber-700">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>Updates every Sunday at 12:05 AM IST</span>
        </div>
      </div>
      
      <main className="px-4">
        <MarketPricesDashboard />
      </main>
    </div>
  );
}
