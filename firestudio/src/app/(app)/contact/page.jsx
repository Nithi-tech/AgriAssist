'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Headphones } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ContactList from '@/components/ContactList';

// Initialize i18n
import '@/lib/i18n.js';

export default function ContactPage() {
  const { t } = useTranslation('common');
  const router = useRouter();

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="hover:bg-green-50 hover:border-green-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back') || 'Back'}
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-full">
            <Headphones className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('contact.page_title') || 'Support'}
            </h1>
            <p className="text-muted-foreground">
              {t('contact.page_subtitle') || 'Get in touch with our team directly'}
            </p>
          </div>
        </div>
      </div>

      {/* Contact List */}
      <Card className="border-green-100/50 shadow-lg">
        <CardContent className="p-8">
          <ContactList />
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          {t('contact.additional_info') || 
          'Available during business hours. For urgent matters, WhatsApp is the fastest way to reach us.'}
        </p>
      </div>
    </div>
  );
}
