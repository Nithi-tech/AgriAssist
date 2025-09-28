import { PageHeader } from '@/components/page-header';
import AllCropsList from '@/components/AllCropsList';

export default function CropsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Enhanced Header */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-100 to-emerald-100 px-6 py-3 rounded-full border border-green-200">
          <span className="text-3xl">🌾</span>
          <h1 className="text-3xl font-bold text-green-800">All Crops</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          View and manage all your crop records with comprehensive farming data and insights
        </p>
      </div>
      
      <div className="mt-8">
        <AllCropsList 
          showStats={true}
          allowDelete={true}
        />
      </div>
    </div>
  );
}
