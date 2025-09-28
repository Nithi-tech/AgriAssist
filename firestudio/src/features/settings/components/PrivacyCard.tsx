import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, ExternalLink } from 'lucide-react';
import { Privacy } from '../types';
import { updatePrivacySettings } from '../mockApi';
import { toast } from '@/hooks/use-toast';

interface PrivacyCardProps {
  privacy: Privacy;
  onUpdate: (privacy: Privacy) => void;
}

export function PrivacyCard({ privacy, onUpdate }: PrivacyCardProps) {
  const { t } = useTranslation();

  const handleToggleChange = async (field: keyof Privacy, value: boolean) => {
    try {
      const updatedPrivacy = await updatePrivacySettings({
        [field]: value,
      });
      onUpdate(updatedPrivacy);
      
      toast({
        title: 'Privacy Setting Updated',
        description: `${field} has been ${value ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      toast({
        title: t('settings.messages.error'),
        description: error instanceof Error ? error.message : 'Failed to update privacy settings',
        variant: 'destructive',
      });
    }
  };

  const privacyOptions = [
    {
      key: 'shareProductionData' as const,
      label: t('settings.privacy.shareProduction'),
      description: 'Allow sharing of your production data with agricultural experts and researchers',
    },
    {
      key: 'expertContact' as const,
      label: t('settings.privacy.expertContact'),
      description: 'Allow agricultural experts to contact you for advice and recommendations',
    },
  ];

  return (
    <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-red-800">
          <Shield className="w-5 h-5" />
          {t('settings.privacy.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Privacy Options */}
        <div className="space-y-4">
          {privacyOptions.map((option) => (
            <div key={option.key} className="bg-white p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor={option.key} className="font-medium text-red-800 cursor-pointer">
                  {option.label}
                </Label>
                <Switch
                  id={option.key}
                  checked={privacy[option.key]}
                  onCheckedChange={(checked) => handleToggleChange(option.key, checked)}
                />
              </div>
              <p className="text-sm text-red-600">{option.description}</p>
            </div>
          ))}
        </div>

        {/* Privacy Policy Link */}
        <div className="pt-4 border-t border-red-200">
          <Button
            variant="outline"
            className="w-full border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => {
              // In a real app, this would navigate to the privacy policy page
              toast({
                title: 'Privacy Policy',
                description: 'This would open the privacy policy page in a real application',
              });
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {t('settings.privacy.privacyPolicy')}
          </Button>
        </div>

        {/* Data Protection Notice */}
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <p className="text-xs text-red-700">
            <strong>Data Protection:</strong> Your personal information is encrypted and securely stored. 
            We never share your data without your explicit consent. You can delete your account and all 
            associated data at any time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
