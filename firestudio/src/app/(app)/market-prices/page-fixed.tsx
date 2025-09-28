'use client';

import React from 'react';
import MarketPricesDashboard from '@/components/market-prices-dashboard';
import { PageHeader } from '@/components/page-header';

export default function MarketPricesPage() {
  return (
    <div className="min-h-screen bg-gray-50/30">
      <PageHeader 
        title="Market Prices" 
        subtitle="Real-time agricultural commodity prices from government sources"
      />
      
      <main className="container mx-auto px-4 py-6">
        <MarketPricesDashboard />
      </main>
    </div>
  );
}
