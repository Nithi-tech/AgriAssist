'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, MessageSquare, Copy, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  buildWhatsAppUrl, 
  formatDisplayNumber, 
  copyToClipboard, 
  logContactAction 
} from '@/lib/contact-utils';

const ContactCard = ({ contact }) => {
  const { t } = useTranslation('common');
  const { toast } = useToast();

  const handleCall = () => {
    logContactAction('call', contact.name);
    // The tel: link will be handled by the browser/OS
  };

  const handleWhatsApp = () => {
    logContactAction('whatsapp', contact.name);
    // The WhatsApp link will be handled by the browser/OS
  };

  const handleCopy = async () => {
    logContactAction('copy', contact.name);
    
    try {
      const success = await copyToClipboard(contact.phone);
      
      if (success) {
        toast({
          title: t('contact.copy_success') || 'Phone number copied',
          description: formatDisplayNumber(contact.phone),
          duration: 2000,
        });
      } else {
        // Fallback: show the number in a toast for manual copying
        toast({
          title: t('contact.copy_fallback') || 'Copy this number:',
          description: formatDisplayNumber(contact.phone),
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: t('contact.copy_error') || 'Copy failed',
        description: t('contact.copy_error_desc') || 'Please copy manually: ' + formatDisplayNumber(contact.phone),
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const displayNumber = formatDisplayNumber(contact.phone);
  const whatsappUrl = buildWhatsAppUrl(contact.phone, contact.name);
  const telUrl = `tel:${contact.phone}`;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-green-100/50 bg-gradient-to-br from-green-50/30 to-yellow-50/30">
      <CardContent className="p-6">
        {/* Contact Info */}
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
            <User className="h-5 w-5 text-green-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground group-hover:text-green-700 transition-colors">
              {contact.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {contact.role || t('contact.team_member') || 'Team Member'}
            </p>
            <p className="text-sm font-mono text-foreground bg-white/50 px-2 py-1 rounded border">
              {displayNumber}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {/* Call Button */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300 transition-colors"
            onClick={handleCall}
          >
            <a
              href={telUrl}
              aria-label={`${t('contact.call')} ${contact.name} ${t('contact.at')} ${displayNumber}`}
            >
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">{t('contact.call')}</span>
            </a>
          </Button>

          {/* WhatsApp Button */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300 transition-colors"
            onClick={handleWhatsApp}
          >
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t('contact.whatsapp')} ${contact.name} ${t('contact.at')} ${displayNumber}`}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{t('contact.whatsapp')}</span>
            </a>
          </Button>

          {/* Copy Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            aria-label={`${t('contact.copy')} ${contact.name} ${t('contact.number')}`}
          >
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">{t('contact.copy')}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactCard;
