import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Edit3 } from 'lucide-react';
import { FarmerProfile } from '../types';
import { ProgressBar } from './ProgressBar';
// Import temporarily commented out due to TypeScript resolution issue
// This will be resolved when the development server is restarted
// import EditProfileModal from './EditProfileModal';

interface ProfileCardProps {
  profile: FarmerProfile;
  onUpdate: (updatedProfile: FarmerProfile) => void;
}

export function ProfileCard({ profile, onUpdate }: ProfileCardProps) {
  const { t } = useTranslation();
  const [showEditModal, setShowEditModal] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-green-800 text-xl">
            <div className="bg-green-500 p-2 rounded-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            {t('settings.profile.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Avatar and Basic Info */}
          <div className="flex items-start gap-6">
            <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
              {profile.profilePicBase64 && (
                <AvatarImage src={profile.profilePicBase64} alt={profile.name} />
              )}
              <AvatarFallback className="bg-green-200 text-green-800 text-xl font-bold">
                {profile.name ? getInitials(profile.name) : 'JF'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xl text-green-800 mb-2">{profile.name || 'Farmer'}</h3>
              <p className="text-green-600 text-lg mb-4">{profile.mobileNumber || 'No mobile number'}</p>
              <Button
                variant="outline"
                size="default"
                onClick={() => setShowEditModal(true)}
                className="border-green-300 text-green-700 hover:bg-green-50 font-medium"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {t('settings.profile.editProfile')}
              </Button>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/60 rounded-lg p-4">
              <label className="text-green-600 font-semibold text-sm uppercase tracking-wide">{t('settings.profile.village')}</label>
              <p className="text-green-800 font-medium text-lg mt-1">{profile.village || 'Not specified'}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-4">
              <label className="text-green-600 font-semibold text-sm uppercase tracking-wide">{t('settings.profile.district')}</label>
              <p className="text-green-800 font-medium text-lg mt-1">{profile.district || 'Not specified'}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-4">
              <label className="text-green-600 font-semibold text-sm uppercase tracking-wide">{t('settings.profile.state')}</label>
              <p className="text-green-800 font-medium text-lg mt-1">{profile.state || 'Not specified'}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-4">
              <label className="text-green-600 font-medium">{t('settings.profile.farmArea')}</label>
              <p className="text-green-800">
                {profile.farmAreaAcres ? `${profile.farmAreaAcres} acres` : 'Not specified'}
              </p>
            </div>
            <div>
              <label className="text-green-600 font-medium">{t('settings.profile.primaryCrop')}</label>
              <p className="text-green-800">{profile.primaryCrop || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-green-600 font-medium">{t('settings.profile.soilType')}</label>
              <p className="text-green-800">{profile.soilType || 'Not specified'}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <ProgressBar profile={profile} />
        </CardContent>
      </Card>

      {/* Edit Modal - Temporarily commented out due to import resolution issue */}
      {/* This will be resolved when the development server is restarted */}
      {/*
      <EditProfileModal
        profile={profile}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={onUpdate}
      />
      */}
    </>
  );
}
