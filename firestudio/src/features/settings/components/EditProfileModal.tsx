import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { FarmerProfile } from '../types';
import { putFarmer } from '../mockApi';

interface EditProfileModalProps {
  profile: FarmerProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProfile: FarmerProfile) => void;
}

const soilTypes = [
  'Sandy',
  'Loamy',
  'Clay',
  'Silt',
  'Sandy Loam',
  'Clay Loam',
  'Silty Clay',
  'Silty Clay Loam',
];

const crops = [
  'Wheat',
  'Rice',
  'Maize',
  'Sugarcane',
  'Cotton',
  'Soybean',
  'Groundnut',
  'Sunflower',
  'Pulses',
  'Vegetables',
  'Fruits',
];

export function EditProfileModal({ profile, isOpen, onClose, onSave }: EditProfileModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<FarmerProfile>>(profile);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(profile.profilePicBase64 || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof FarmerProfile, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 2MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      setFormData(prev => ({
        ...prev,
        profilePicBase64: base64,
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    if (!formData.name?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name is required',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.mobileNumber && !/^\+?[0-9\s-]{8,15}$/.test(formData.mobileNumber)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid mobile number',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.farmAreaAcres && formData.farmAreaAcres < 0) {
      toast({
        title: 'Validation Error',
        description: 'Farm area cannot be negative',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const updatedProfile = await putFarmer(profile.id, formData);
      onSave(updatedProfile);
      onClose();
      toast({
        title: t('settings.messages.profileUpdated'),
        description: 'Profile has been successfully updated',
      });
    } catch (error) {
      toast({
        title: t('settings.messages.error'),
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('settings.profile.editProfile')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-24 h-24">
              {imagePreview && <AvatarImage src={imagePreview} alt="Profile preview" />}
              <AvatarFallback className="bg-green-100 text-green-800 text-xl">
                {formData.name ? getInitials(formData.name) : 'JF'}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              {t('settings.profile.profilePicture')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('settings.profile.name')} *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">{t('settings.profile.mobile')}</Label>
              <Input
                id="mobile"
                value={formData.mobileNumber || ''}
                onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                placeholder="+91-9876543210"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="village">{t('settings.profile.village')}</Label>
              <Input
                id="village"
                value={formData.village || ''}
                onChange={(e) => handleInputChange('village', e.target.value)}
                placeholder="Enter village name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">{t('settings.profile.district')}</Label>
              <Input
                id="district"
                value={formData.district || ''}
                onChange={(e) => handleInputChange('district', e.target.value)}
                placeholder="Enter district name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">{t('settings.profile.state')}</Label>
              <Input
                id="state"
                value={formData.state || ''}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="Enter state name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="farmArea">{t('settings.profile.farmArea')}</Label>
              <Input
                id="farmArea"
                type="number"
                min="0"
                step="0.1"
                value={formData.farmAreaAcres || ''}
                onChange={(e) => handleInputChange('farmAreaAcres', parseFloat(e.target.value) || 0)}
                placeholder="5.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryCrop">{t('settings.profile.primaryCrop')}</Label>
              <Select
                value={formData.primaryCrop || ''}
                onValueChange={(value) => handleInputChange('primaryCrop', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select primary crop" />
                </SelectTrigger>
                <SelectContent>
                  {crops.map((crop) => (
                    <SelectItem key={crop} value={crop}>
                      {crop}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="soilType">{t('settings.profile.soilType')}</Label>
              <Select
                value={formData.soilType || ''}
                onValueChange={(value) => handleInputChange('soilType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select soil type" />
                </SelectTrigger>
                <SelectContent>
                  {soilTypes.map((soil) => (
                    <SelectItem key={soil} value={soil}>
                      {soil}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t('settings.profile.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('settings.profile.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Default export for better compatibility
export default EditProfileModal;
