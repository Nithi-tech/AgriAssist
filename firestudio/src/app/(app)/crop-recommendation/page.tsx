'use client';

import { CropRecommendationForm } from '@/components/crop-recommendation-form';
import { PageHeader } from '@/components/page-header';
import { useLanguage } from '@/hooks/use-language';

export default function CropRecommendationPage() {
  const { t } = useLanguage();
  return (
    <>
      <PageHeader title={t.cropRecommendationTitle} subtitle={t.cropRecSubTitle} />
      <CropRecommendationForm />
    </>
  );
}
