'use client';

import { DiseaseDiagnosisForm } from '@/components/disease-diagnosis-form';
import { PageHeader } from '@/components/page-header';
import { useLanguage } from '@/hooks/use-language';

export default function DiseaseDiagnosisPage() {
  const { t } = useLanguage();
  return (
    <>
      <PageHeader title={t.diseaseDiagnosisTitle} subtitle={t.diseaseDiagSubTitle} />
      
      <DiseaseDiagnosisForm />
    </>
  );
}
