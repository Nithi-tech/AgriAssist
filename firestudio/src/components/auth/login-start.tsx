'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Smartphone, ArrowRight } from 'lucide-react';

interface LoginStartProps {
  onMobileSubmit: (mobile: string, userExists: boolean) => void;
}

export default function LoginStart({ onMobileSubmit }: LoginStartProps) {
  const [mobile, setMobile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const formatMobileNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Limit to 10 digits and format
    const limited = digits.slice(0, 10);
    
    if (limited.length >= 6) {
      return `${limited.slice(0, 5)} ${limited.slice(5)}`;
    } else if (limited.length >= 1) {
      return limited;
    }
    
    return '';
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatMobileNumber(e.target.value);
    setMobile(formatted);
    setError(''); // Clear error when user types
  };

  const validateMobile = (mobile: string): boolean => {
    const cleaned = mobile.replace(/\D/g, '');
    return cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateMobile(mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const cleanedMobile = mobile.replace(/\D/g, '');
      
      const response = await fetch('/api/auth/check-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile_number: cleanedMobile }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to check mobile number');
      }

      if (data.success) {
        onMobileSubmit(cleanedMobile, data.data.exists);
      } else {
        setError(data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Check mobile error:', error);
      setError(error instanceof Error ? error.message : 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
            <Smartphone className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to FireStudio</CardTitle>
          <CardDescription>
            Enter your mobile number to get started
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="mobile" className="text-sm font-medium">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">+91</span>
                </div>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="98765 43210"
                  value={mobile}
                  onChange={handleMobileChange}
                  className="pl-12 text-lg tracking-wider"
                  disabled={isLoading}
                  maxLength={11} // 10 digits + 1 space
                />
              </div>
              <p className="text-xs text-gray-500">
                We'll send you a verification code
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
              disabled={isLoading || !validateMobile(mobile)}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>By continuing, you agree to our</p>
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
