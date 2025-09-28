'use client';

import { PageHeader } from '@/components/page-header';
import { useUnifiedTranslation } from '@/hooks/use-unified-translation';

interface FertilizerShopWrapperProps {
  children: React.ReactNode;
}

export function FertilizerShopWrapper({ children }: FertilizerShopWrapperProps) {
  const { t } = useUnifiedTranslation();
  
  return (
    <>
      <PageHeader 
        title={t('fertilizerShops', 'Fertilizer Shops')} 
        subtitle={t('fertilizerShopsSubtitle', 'Government-approved fertilizer shops across India')} 
      />
      {children}
    </>
  );
}
