'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FeedbackForm from '@/components/FeedbackForm';

// Initialize i18n
import '@/lib/i18n.js';

export default function FeedbackPage() {
  const { t } = useTranslation('common');
  const router = useRouter();

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t('settings.feedback_label')}</h1>
            <p className="text-muted-foreground">Help us improve AgriAssist</p>
          </div>
        </div>
      </div>

      {/* Feedback Form */}
      <Card>
        <CardContent className="p-8">
          <FeedbackForm />
        </CardContent>
      </Card>
    </div>
  );
}
