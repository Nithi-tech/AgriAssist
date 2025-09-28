'use client';

import { PageHeader } from '@/components/page-header';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent } from '@/components/ui/card';

const policies = [
  {
    id: 'pm-kisan',
    title: 'PM-KISAN Scheme',
    description: 'The Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) is a central sector scheme with 100% funding from the Government of India. It provides income support to all landholding farmer families in the country to supplement their financial needs for procuring various inputs related to agriculture and allied activities as well as domestic needs.',
  },
  {
    id: 'fasal-bima',
    title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    description: 'PMFBY is the government-sponsored crop insurance scheme that integrates multiple stakeholders on a single platform. It aims to provide a comprehensive insurance cover against failure of the crop thus helping in stabilising the income of the farmers.',
  },
  {
    id: 'soil-health-card',
    title: 'Soil Health Card Scheme',
    description: 'The scheme has been introduced to assist State Governments to issue Soil Health Cards to all farmers in the country. Soil Health Card provides information to farmers on nutrient status of their soil along with recommendation on appropriate dosage of nutrients to be applied for improving soil health and its fertility.',
  },
  {
    id: 'kcc',
    title: 'Kisan Credit Card (KCC) Scheme',
    description: 'The Kisan Credit Card (KCC) scheme aims at providing adequate and timely credit support from the banking system under a single window with flexible and simplified procedure to the farmers for their cultivation and other needs.',
  },
];

export default function PoliciesPage() {
  const { t } = useLanguage();
  return (
    <>
      <PageHeader title={t.policiesTitle} subtitle={t.policiesSubTitle} />
      <Card>
        <CardContent className="p-6">
          <Accordion type="single" collapsible className="w-full">
            {policies.map((policy) => (
              <AccordionItem value={policy.id} key={policy.id}>
                <AccordionTrigger className="font-headline text-lg">{policy.title}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {policy.description}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}
