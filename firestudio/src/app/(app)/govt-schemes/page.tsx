'use client';

import WelfareSchemesBrowser from '@/components/WelfareSchemesBrowser';
import { PageHeader } from '@/components/page-header';

export default function GovtSchemesPage() {
  return (
    <>
      <PageHeader 
        title="Government Schemes" 
        subtitle="Explore welfare schemes and benefits available to farmers and citizens" 
      />
      <WelfareSchemesBrowser />
    </>
  );
}
