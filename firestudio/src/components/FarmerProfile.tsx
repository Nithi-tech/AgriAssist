'use client';

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  User, 
  MapPin, 
  Phone, 
  Leaf, 
  Droplets, 
  AlertTriangle, 
  Target,
  Activity,
  Settings,
  TrendingUp
} from 'lucide-react';
import { useUnifiedTranslation } from '@/hooks/use-unified-translation-safe';

// Farmer profile data - moved to a constant to avoid hydration issues
const FARMER_PROFILE = {
  id: 'FMR-GHY-1024',
  name: 'Ranjit Das',
  age: 42,
  location: 'Chandrapur Village, near Guwahati, Assam',
  phone: '+91 94351 67892',
  landSize: '3.5 acres',
  primaryCrops: 'Rice (Sali variety), Mustard, Vegetables (Brinjal, Tomato, Chili)',
  farmingType: 'Traditional + Semi-modern (uses irrigation pump & soil testing occasionally)',
  irrigationSource: 'Borewell + Rainwater harvesting',
  annualYield: '18–20 quintals of rice, 8 quintals of mustard, seasonal vegetables',
  challenges: 'Flooding during monsoon, Pest attacks in paddy fields, Lack of real-time weather updates',
  goals: 'Better weather forecasting, Access to low-cost pest control solutions, AI-based irrigation suggestions',
  avatar: '/farmer-avatar.svg'
} as const;

interface FarmerProfileProps {
  className?: string;
}

export function FarmerProfile({ className = '' }: FarmerProfileProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { t } = useUnifiedTranslation();

  // Ensure component is mounted before showing dynamic content
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render dynamic content until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <Avatar className={`h-10 w-10 ring-2 ring-primary/30 ${className}`}>
        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
          <User className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <>
      {/* Profile Avatar - Clickable */}
      <Avatar 
        className={`h-10 w-10 ring-2 ring-primary/30 hover:ring-primary/50 transition-all cursor-pointer card-hover ${className}`}
        onClick={() => setShowProfileModal(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowProfileModal(true);
          }
        }}
        aria-label={`Open ${FARMER_PROFILE.name}'s profile`}
      >
        <AvatarImage 
          src={FARMER_PROFILE.avatar} 
          alt={`${FARMER_PROFILE.name}'s profile picture`} 
        />
        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
          {FARMER_PROFILE.name.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>

      {/* Farmer Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto glass border-white/20 shadow-2xl"
          aria-describedby="farmer-profile-description"
        >
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-xl shadow-lg">
                <User className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              {t('farmerProfile', 'Farmer Profile')}
            </DialogTitle>
          </DialogHeader>
          
          <div id="farmer-profile-description" className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Picture and Basic Info */}
              <div className="lg:col-span-1">
                <Card className="glass border-white/20 p-4 md:p-6">
                  <div className="text-center space-y-4">
                    <Avatar className="h-20 w-20 md:h-24 md:w-24 mx-auto ring-4 ring-primary/30">
                      <AvatarImage 
                        src={FARMER_PROFILE.avatar} 
                        alt={`${FARMER_PROFILE.name}'s profile picture`} 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl md:text-2xl">
                        {FARMER_PROFILE.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold">{FARMER_PROFILE.name}</h3>
                      <p className="text-muted-foreground">{t('age', 'Age')}: {FARMER_PROFILE.age}</p>
                      <Badge className="mt-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs">
                        ID: {FARMER_PROFILE.id}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Contact and Location */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="glass border-white/20 p-4 md:p-6">
                  <h4 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    {t('contactLocation', 'Contact & Location')}
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/30 backdrop-blur-sm">
                      <Phone className="h-4 w-4 md:h-5 md:w-5 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('phone', 'Phone')}</p>
                        <p className="font-medium text-sm md:text-base">
                          <a 
                            href={`tel:${FARMER_PROFILE.phone}`}
                            className="hover:text-blue-600 transition-colors"
                            aria-label={`Call ${FARMER_PROFILE.name} at ${FARMER_PROFILE.phone}`}
                          >
                            {FARMER_PROFILE.phone}
                          </a>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/30 backdrop-blur-sm">
                      <MapPin className="h-4 w-4 md:h-5 md:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('location', 'Location')}</p>
                        <p className="font-medium text-sm">{FARMER_PROFILE.location}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Farm Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-white/20 p-4 md:p-6">
                <h4 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                  <Leaf className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                  {t('farmDetails', 'Farm Details')}
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 rounded bg-white/20">
                    <span className="text-sm text-muted-foreground">{t('landSize', 'Land Size')}</span>
                    <span className="font-medium text-sm md:text-base">{FARMER_PROFILE.landSize}</span>
                  </div>
                  <div className="p-2 rounded bg-white/20">
                    <span className="text-sm text-muted-foreground block mb-1">{t('primaryCrops', 'Primary Crops')}</span>
                    <span className="font-medium text-sm">{FARMER_PROFILE.primaryCrops}</span>
                  </div>
                  <div className="p-2 rounded bg-white/20">
                    <span className="text-sm text-muted-foreground block mb-1">{t('farmingType', 'Farming Type')}</span>
                    <span className="font-medium text-sm">{FARMER_PROFILE.farmingType}</span>
                  </div>
                </div>
              </Card>

              <Card className="glass border-white/20 p-4 md:p-6">
                <h4 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                  <Droplets className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                  {t('irrigationYield', 'Irrigation & Yield')}
                </h4>
                <div className="space-y-3">
                  <div className="p-2 rounded bg-white/20">
                    <span className="text-sm text-muted-foreground block mb-1">{t('irrigationSource', 'Irrigation Source')}</span>
                    <span className="font-medium text-sm">{FARMER_PROFILE.irrigationSource}</span>
                  </div>
                  <div className="p-2 rounded bg-white/20">
                    <span className="text-sm text-muted-foreground block mb-1">{t('annualYield', 'Annual Yield')}</span>
                    <span className="font-medium text-sm">{FARMER_PROFILE.annualYield}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Challenges and Goals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-white/20 p-4 md:p-6">
                <h4 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
                  {t('challengesFaced', 'Challenges Faced')}
                </h4>
                <div className="p-3 rounded-lg bg-orange-50/50 border border-orange-200/50">
                  <p className="text-sm leading-relaxed">{FARMER_PROFILE.challenges}</p>
                </div>
              </Card>

              <Card className="glass border-white/20 p-4 md:p-6">
                <h4 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
                  {t('needsGoals', 'Needs & Goals')}
                </h4>
                <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-200/50">
                  <p className="text-sm leading-relaxed">{FARMER_PROFILE.goals}</p>
                </div>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-white/20">
              <Button 
                className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 text-sm"
                aria-label="View detailed farm activity and analytics"
              >
                <Activity className="h-4 w-4 mr-2" />
                {t('viewFarmActivity', 'View Farm Activity')}
              </Button>
              <Button 
                variant="outline" 
                className="border-primary/20 hover:bg-primary/10 text-sm"
                aria-label="Edit farmer profile information"
              >
                <Settings className="h-4 w-4 mr-2" />
                {t('editProfile', 'Edit Profile')}
              </Button>
              <Button 
                variant="outline" 
                className="border-blue-200 hover:bg-blue-50 text-sm"
                aria-label="View farm analytics and reports"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {t('viewAnalytics', 'View Analytics')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default FarmerProfile;
