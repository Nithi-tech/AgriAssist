'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Heart } from 'lucide-react';
import ContactCard from '@/components/ContactCard';
import { TEAM_CONTACTS } from '@/lib/contact-utils';

const ContactList = () => {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-8">
      {/* About Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-green-100 rounded-full">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">
            {t('contact.support_title') || 'Support'}
          </h3>
        </div>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('contact.support_subtitle') || 'Get help from our team — call or WhatsApp any member for quick assistance.'}
        </p>
        
        <div className="bg-gradient-to-r from-green-50 to-yellow-50 p-6 rounded-lg border border-green-100/50">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('contact.about_paragraph') || 
            'AgriAssist is your smart farming companion, designed to empower farmers with AI-powered tools and insights for better crop management and decision making. We support multiple Indian languages to make tools accessible to farmers across different regions.'}
          </p>
        </div>
      </div>

      {/* Contact Grid */}
      <div className="space-y-4">
        <div className="text-center">
          <h4 className="text-lg font-semibold text-foreground mb-2">
            {t('contact.team_title') || 'Our Team'}
          </h4>
          <p className="text-sm text-muted-foreground">
            {t('contact.help_text') || 'Feel free to contact any team member for assistance'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEAM_CONTACTS.map((contact, index) => (
            <ContactCard 
              key={`${contact.name}-${index}`} 
              contact={contact} 
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 border-t border-green-100/50">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Heart className="h-4 w-4 text-red-500" />
          <p className="text-xs">
            {t('contact.footer_text') || 'We are here to help you succeed in your farming journey'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactList;
