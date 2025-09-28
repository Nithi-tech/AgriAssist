'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, User, MapPin } from 'lucide-react';

interface SignUpFormProps {
  mobile: string;
  onBack: () => void;
  onSignUpComplete: (userData: any) => void;
}

interface LocationData {
  address: string;
  city: string;
  state: string;
  country: string;
  lat?: number;
  lng?: number;
}

export default function SignUpForm({ mobile, onBack, onSignUpComplete }: SignUpFormProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState<LocationData>({
    address: '',
    city: '',
    state: '',
    country: 'India'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState('');

  // Format mobile number for display
  const formatDisplayMobile = (mobile: string) => {
    if (mobile.length === 10) {
      return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
    }
    return `+91 ${mobile}`;
  };

  const validateName = (name: string): boolean => {
    const trimmed = name.trim();
    return trimmed.length >= 2 && trimmed.length <= 100 && /^[a-zA-Z\s'\-]+$/.test(trimmed);
  };

  const validateLocation = (loc: LocationData): boolean => {
    return !!(loc.address.trim() && loc.city.trim() && loc.state.trim());
  };

  // Get user's current location
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    setError('');

    try {
      // Get GPS coordinates
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get address
      try {
        // Using a free geocoding service (you might want to use Google Maps API or similar)
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        
        const data = await response.json();
        
        if (data && data.locality) {
          setLocation(prev => ({
            ...prev,
            address: data.locality || '',
            city: data.city || data.locality || '',
            state: data.principalSubdivision || '',
            country: data.countryName || 'India',
            lat: latitude,
            lng: longitude
          }));
        }
      } catch (geocodeError) {
        // If geocoding fails, just set coordinates
        setLocation(prev => ({
          ...prev,
          lat: latitude,
          lng: longitude
        }));
      }
    } catch (error) {
      console.error('Location error:', error);
      setError('Unable to get your location. Please enter manually.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleLocationChange = (field: keyof LocationData, value: string) => {
    setLocation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateName(name)) {
      setError('Please enter a valid name (2-100 characters, letters only)');
      return;
    }

    // Location is optional, but if provided should be valid
    const hasLocation = location.address.trim() || location.city.trim() || location.state.trim();
    if (hasLocation && !validateLocation(location)) {
      setError('Please provide complete location details (address, city, state)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const requestData: any = {
        mobile_number: mobile,
        name: name.trim()
      };

      // Only include location if some fields are filled
      if (hasLocation) {
        requestData.location = location;
      }

      const response = await fetch('/api/auth/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      if (data.success) {
        onSignUpComplete(data.data.user);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="absolute left-4 top-4 p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
            <User className="h-8 w-8 text-green-600" />
          </div>
          
          <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
          <CardDescription>
            Set up your account for<br />
            <span className="font-semibold text-foreground">
              {formatDisplayMobile(mobile)}
            </span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name *
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
                className="text-base"
              />
            </div>

            {/* Location Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Location (Optional)</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation || isLoading}
                  className="text-xs"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Getting...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-1 h-3 w-3" />
                      Auto-fill
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Input
                  placeholder="Address"
                  value={location.address}
                  onChange={(e) => handleLocationChange('address', e.target.value)}
                  disabled={isLoading}
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="City"
                    value={location.city}
                    onChange={(e) => handleLocationChange('city', e.target.value)}
                    disabled={isLoading}
                  />
                  <Input
                    placeholder="State"
                    value={location.state}
                    onChange={(e) => handleLocationChange('state', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <Input
                  placeholder="Country"
                  value={location.country}
                  onChange={(e) => handleLocationChange('country', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <p className="text-xs text-gray-500">
                Location helps us provide better local recommendations
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !validateName(name)}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Complete Registration'
              )}
            </Button>
          </form>

          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>By creating an account, you agree to our</p>
            <div className="space-x-1">
              <a href="/policies" className="text-green-600 hover:underline">
                Terms of Service
              </a>
              <span>and</span>
              <a href="/policies" className="text-green-600 hover:underline">
                Privacy Policy
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
