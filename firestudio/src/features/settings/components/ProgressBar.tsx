import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  profile: {
    name?: string;
    mobileNumber?: string;
    village?: string;
    district?: string;
    state?: string;
    farmAreaAcres?: number;
    primaryCrop?: string;
    soilType?: string;
    profilePicBase64?: string;
  };
}

export function ProgressBar({ profile }: ProgressBarProps) {
  const fields = [
    'name',
    'mobileNumber',
    'village',
    'district',
    'state',
    'farmAreaAcres',
    'primaryCrop',
    'soilType',
    'profilePicBase64',
  ];

  const filledFields = fields.filter((field) => {
    const value = profile[field as keyof typeof profile];
    return value !== undefined && value !== null && value !== '';
  });

  const completionPercentage = Math.round((filledFields.length / fields.length) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Profile Completion</span>
        <span className="font-medium">{completionPercentage}%</span>
      </div>
      <Progress value={completionPercentage} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {filledFields.length} of {fields.length} fields completed
      </p>
    </div>
  );
}
