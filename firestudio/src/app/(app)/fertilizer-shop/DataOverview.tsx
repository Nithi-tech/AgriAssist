'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useUnifiedTranslation } from '@/hooks/use-unified-translation';
import type { FertilizerShopData } from '@/server/fertilizer-shop-loader';

interface DataOverviewProps {
  data: FertilizerShopData;
}

export function DataOverview({ data }: DataOverviewProps) {
  const { t } = useUnifiedTranslation();
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{data.totalCount}</div>
            <div className="text-sm text-muted-foreground">{t('totalShops', 'Total Shops')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{data.states.length}</div>
            <div className="text-sm text-muted-foreground">{t('statesCovered', 'States Covered')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{data.districts.length}</div>
            <div className="text-sm text-muted-foreground">{t('districts', 'Districts')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
