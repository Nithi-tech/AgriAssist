import { PageHeader } from '@/components/page-header';
import MyCropDisplay from '@/components/MyCropDisplay';

export default function MyCropPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="🌱 My Current Crop"
        subtitle="View your latest crop details and progress (read-only)"
      />
      
      <div className="mt-8">
        <MyCropDisplay />
      </div>
    </div>
  );
}
