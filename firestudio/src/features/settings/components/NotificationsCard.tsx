import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, MessageSquare, Phone, Smartphone, Plus, X } from 'lucide-react';
import { NotificationPreferences, NotificationChannel } from '../types';
import { updateNotificationSettings } from '../mockApi';
import { toast } from '@/hooks/use-toast';

interface NotificationsCardProps {
  notifications: NotificationPreferences;
  onUpdate: (notifications: NotificationPreferences) => void;
}

export function NotificationsCard({ notifications, onUpdate }: NotificationsCardProps) {
  const { t } = useTranslation();
  const [newContact, setNewContact] = useState('');

  const handleToggleChange = async (field: keyof NotificationPreferences, value: boolean) => {
    try {
      const updatedNotifications = await updateNotificationSettings({
        [field]: value,
      });
      onUpdate(updatedNotifications);
    } catch (error) {
      toast({
        title: t('settings.messages.error'),
        description: error instanceof Error ? error.message : 'Failed to update notifications',
        variant: 'destructive',
      });
    }
  };

  const handleChannelChange = async (channel: NotificationChannel, checked: boolean) => {
    try {
      const updatedChannels = checked
        ? [...notifications.channels, channel]
        : notifications.channels.filter((c) => c !== channel);

      const updatedNotifications = await updateNotificationSettings({
        channels: updatedChannels,
      });
      onUpdate(updatedNotifications);
    } catch (error) {
      toast({
        title: t('settings.messages.error'),
        description: error instanceof Error ? error.message : 'Failed to update notification channels',
        variant: 'destructive',
      });
    }
  };

  const handleAddContact = async () => {
    if (!newContact.trim()) return;

    // Validate phone number format
    if (!/^\+?[0-9\s-]{8,15}$/.test(newContact)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid phone number',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updatedContacts = [...notifications.familyContacts, newContact.trim()];
      const updatedNotifications = await updateNotificationSettings({
        familyContacts: updatedContacts,
      });
      onUpdate(updatedNotifications);
      setNewContact('');
      
      toast({
        title: 'Contact Added',
        description: 'Family contact has been added successfully',
      });
    } catch (error) {
      toast({
        title: t('settings.messages.error'),
        description: error instanceof Error ? error.message : 'Failed to add contact',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveContact = async (index: number) => {
    try {
      const updatedContacts = notifications.familyContacts.filter((_, i) => i !== index);
      const updatedNotifications = await updateNotificationSettings({
        familyContacts: updatedContacts,
      });
      onUpdate(updatedNotifications);
    } catch (error) {
      toast({
        title: t('settings.messages.error'),
        description: error instanceof Error ? error.message : 'Failed to remove contact',
        variant: 'destructive',
      });
    }
  };

  const notificationTypes = [
    {
      key: 'priceAlerts' as const,
      label: t('settings.notifications.priceAlerts'),
      description: 'Get notified about crop price changes',
    },
    {
      key: 'weatherWarnings' as const,
      label: t('settings.notifications.weatherWarnings'),
      description: 'Receive weather alerts and warnings',
    },
    {
      key: 'schemeUpdates' as const,
      label: t('settings.notifications.schemeUpdates'),
      description: 'Updates about government schemes',
    },
    {
      key: 'cropReminders' as const,
      label: t('settings.notifications.cropReminders'),
      description: 'Reminders for farming activities',
    },
    {
      key: 'expertAdvice' as const,
      label: t('settings.notifications.expertAdvice'),
      description: 'Expert advice and recommendations',
    },
  ];

  const channelOptions = [
    {
      value: 'inapp' as const,
      label: t('settings.notifications.inapp'),
      icon: Bell,
      description: 'In-app notifications',
    },
    {
      value: 'sms' as const,
      label: t('settings.notifications.sms'),
      icon: MessageSquare,
      description: 'SMS messages',
    },
    {
      value: 'whatsapp' as const,
      label: t('settings.notifications.whatsapp'),
      icon: Phone,
      description: 'WhatsApp messages',
    },
  ];

  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <Bell className="w-5 h-5" />
          {t('settings.notifications.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Types */}
        <div className="space-y-4">
          <h4 className="font-medium text-yellow-800">Notification Types</h4>
          {notificationTypes.map((type) => (
            <div key={type.key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
              <div className="flex-1">
                <Label htmlFor={type.key} className="font-medium text-yellow-800 cursor-pointer">
                  {type.label}
                </Label>
                <p className="text-sm text-yellow-600">{type.description}</p>
              </div>
              <Switch
                id={type.key}
                checked={notifications[type.key]}
                onCheckedChange={(checked) => handleToggleChange(type.key, checked)}
              />
            </div>
          ))}
        </div>

        {/* Notification Channels */}
        <div className="space-y-4">
          <h4 className="font-medium text-yellow-800">{t('settings.notifications.channels')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {channelOptions.map((channel) => {
              const IconComponent = channel.icon;
              return (
                <div
                  key={channel.value}
                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-yellow-200"
                >
                  <Checkbox
                    id={channel.value}
                    checked={notifications.channels.includes(channel.value)}
                    onCheckedChange={(checked) => handleChannelChange(channel.value, checked as boolean)}
                  />
                  <Label
                    htmlFor={channel.value}
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <IconComponent className="w-4 h-4 text-yellow-600" />
                    <div>
                      <div className="font-medium text-yellow-800">{channel.label}</div>
                      <div className="text-xs text-yellow-600">{channel.description}</div>
                    </div>
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Family Contacts */}
        <div className="space-y-4">
          <h4 className="font-medium text-yellow-800">{t('settings.notifications.familyContacts')}</h4>
          
          {/* Add New Contact */}
          <div className="flex gap-2">
            <Input
              placeholder="+91-9876543210"
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddContact()}
              className="flex-1"
            />
            <Button onClick={handleAddContact} size="sm" className="bg-yellow-600 hover:bg-yellow-700">
              <Plus className="w-4 h-4 mr-1" />
              {t('settings.notifications.addContact')}
            </Button>
          </div>

          {/* Contact List */}
          {notifications.familyContacts.length > 0 && (
            <div className="space-y-2">
              {notifications.familyContacts.map((contact, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-white rounded border border-yellow-200"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-yellow-600" />
                    <span className="text-yellow-800">{contact}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveContact(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
