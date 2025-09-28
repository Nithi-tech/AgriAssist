import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { loadFertilizerShopsData } from '@/server/fertilizer-shop-loader';
import { FertilizerShopClient } from './FertilizerShopClient';
import { FertilizerShopWrapper } from './FertilizerShopWrapper';
import { DataOverview } from './DataOverview';

/**
 * Fertilizer Shop Page - Server Side Rendered
 * 
 * This page displays government-approved fertilizer shops from CSV data.
 * Features:
 * - Server-side CSV loading and parsing for SSR safety
 * - Client-side filtering by state, district, and search term
 * - Sortable table with pagination (25 items per page)
 * - Responsive design with accessibility support
 */
export default async function FertilizerShopPage() {
  let data;
  let error: string | null = null;

  try {
    // Load CSV data on server side for SSR
    data = await loadFertilizerShopsData();
  } catch (err) {
    console.error('Failed to load fertilizer shop data:', err);
    error = err instanceof Error ? err.message : 'Unknown error occurred';
  }

  // Error state - show error message if data loading failed
  if (error || !data) {
    return (
      <FertilizerShopWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Fertilizer shop data not available. Please contact admin.
              {error && (
                <div className="mt-2 text-sm">
                  Technical details: {error}
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </FertilizerShopWrapper>
    );
  }

  // Success state - render the main content
  return (
    <FertilizerShopWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Data Overview Card */}
        <DataOverview data={data} />

        {/* Client-side Interactive Components */}
        <FertilizerShopClient data={data} />
      </div>
    </FertilizerShopWrapper>
  );
}
