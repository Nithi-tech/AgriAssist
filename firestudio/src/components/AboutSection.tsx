'use client';

import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import { languages } from '@/lib/translations';

export default function AboutSection() {
  const { t } = useLanguage();

  return (
    <div className="space-y-4 text-sm text-muted-foreground">
      <div>
        <h3 className="font-semibold text-foreground mb-2">Mission</h3>
        <p>
          AgriAssist is your smart farming companion, designed to empower farmers with 
          AI-powered tools and insights for better crop management and decision making.
        </p>
      </div>
      
      <div>
        <h3 className="font-semibold text-foreground mb-2">Features</h3>
        <ul className="space-y-1 ml-4">
          <li>• AI-powered crop recommendations based on soil and weather conditions</li>
          <li>• Plant disease diagnosis using computer vision</li>
          <li>• 7-day weather forecasts for farming activities planning</li>
          <li>• Government schemes and policies information</li>
          <li>• Multi-language support for Indian farmers</li>
        </ul>
      </div>
      
      <div>
        <h3 className="font-semibold text-foreground mb-2">Support</h3>
        <p>
          Built with ❤️ for Indian farmers. We support {Object.keys(languages).length} languages 
          to make farming technology accessible to everyone.
        </p>
      </div>
    </div>
  );
}
