import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Droplets, Sparkles, Bug, Calendar, Lightbulb } from 'lucide-react';
import { FarmingReminders, FarmerProfile } from '../types';
import { updateReminderSettings } from '../mockApi';
import { toast } from '@/hooks/use-toast';

interface FarmingRemindersCardProps {
  reminders: FarmingReminders;
  profile: FarmerProfile;
  onUpdate: (reminders: FarmingReminders) => void;
}

export function FarmingRemindersCard({ reminders, profile, onUpdate }: FarmingRemindersCardProps) {
  const { t } = useTranslation();

  const handleToggleChange = async (
    section: 'irrigation' | 'fertilizer' | 'pesticide',
    field: string,
    value: any
  ) => {
    try {
      const updatedReminders = await updateReminderSettings({
        [section]: {
          ...reminders[section],
          [field]: value,
        },
      });
      onUpdate(updatedReminders);
    } catch (error) {
      toast({
        title: t('settings.messages.error'),
        description: error instanceof Error ? error.message : 'Failed to update reminders',
        variant: 'destructive',
      });
    }
  };

  const suggestIrrigationFrequency = () => {
    const soilType = profile.soilType?.toLowerCase();
    let frequency = 3; // default

    if (soilType?.includes('sandy')) {
      frequency = 2; // Sandy soil needs more frequent watering
    } else if (soilType?.includes('clay')) {
      frequency = 4; // Clay soil retains water longer
    } else if (soilType?.includes('loamy')) {
      frequency = 3; // Loamy is balanced
    }

    handleToggleChange('irrigation', 'frequencyDays', frequency);
    
    toast({
      title: 'Frequency Suggested',
      description: `Based on your ${profile.soilType} soil, irrigation every ${frequency} days is recommended`,
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const handleDateChange = (
    section: 'fertilizer' | 'pesticide',
    dateString: string
  ) => {
    const isoDate = dateString ? new Date(dateString).toISOString() : undefined;
    handleToggleChange(section, 'nextDate', isoDate);
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Droplets className="w-5 h-5" />
          {t('settings.reminders.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Irrigation Reminders */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-green-800">{t('settings.reminders.irrigation')}</h4>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-green-200 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="irrigation-enabled" className="font-medium text-green-800">
                {t('settings.reminders.enabled')}
              </Label>
              <Switch
                id="irrigation-enabled"
                checked={reminders.irrigation.enabled}
                onCheckedChange={(checked) => handleToggleChange('irrigation', 'enabled', checked)}
              />
            </div>

            {reminders.irrigation.enabled && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-green-700">{t('settings.reminders.frequency')}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="14"
                        value={reminders.irrigation.frequencyDays || ''}
                        onChange={(e) => handleToggleChange('irrigation', 'frequencyDays', parseInt(e.target.value))}
                        placeholder="3"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={suggestIrrigationFrequency}
                        className="flex items-center gap-1"
                      >
                        <Lightbulb className="w-4 h-4" />
                        {t('settings.reminders.suggestFrequency')}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-green-700">{t('settings.reminders.timeOfDay')}</Label>
                    <Select
                      value={reminders.irrigation.bestTimeOfDay || ''}
                      onValueChange={(value) => handleToggleChange('irrigation', 'bestTimeOfDay', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">{t('settings.reminders.morning')}</SelectItem>
                        <SelectItem value="evening">{t('settings.reminders.evening')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Fertilizer Schedule */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-green-800">{t('settings.reminders.fertilizer')}</h4>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-green-200 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="fertilizer-enabled" className="font-medium text-green-800">
                {t('settings.reminders.enabled')}
              </Label>
              <Switch
                id="fertilizer-enabled"
                checked={reminders.fertilizer.enabled}
                onCheckedChange={(checked) => handleToggleChange('fertilizer', 'enabled', checked)}
              />
            </div>

            {reminders.fertilizer.enabled && (
              <div className="space-y-2">
                <Label className="text-green-700">{t('settings.reminders.nextDate')}</Label>
                <Input
                  type="date"
                  value={formatDate(reminders.fertilizer.nextDate)}
                  onChange={(e) => handleDateChange('fertilizer', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}
          </div>
        </div>

        {/* Pesticide Schedule */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-600" />
            <h4 className="font-medium text-green-800">{t('settings.reminders.pesticide')}</h4>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-green-200 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="pesticide-enabled" className="font-medium text-green-800">
                {t('settings.reminders.enabled')}
              </Label>
              <Switch
                id="pesticide-enabled"
                checked={reminders.pesticide.enabled}
                onCheckedChange={(checked) => handleToggleChange('pesticide', 'enabled', checked)}
              />
            </div>

            {reminders.pesticide.enabled && (
              <div className="space-y-2">
                <Label className="text-green-700">{t('settings.reminders.nextDate')}</Label>
                <Input
                  type="date"
                  value={formatDate(reminders.pesticide.nextDate)}
                  onChange={(e) => handleDateChange('pesticide', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
