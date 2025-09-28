'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, RefreshCw, Shield } from 'lucide-react';

interface LoginOTPProps {
  mobile: string;
  isNewUser: boolean;
  onBack: () => void;
  onOTPVerified: (userData?: any) => void;
  onNeedRegistration: (mobile: string) => void;
}

export default function LoginOTP({ 
  mobile, 
  isNewUser, 
  onBack, 
  onOTPVerified,
  onNeedRegistration 
}: LoginOTPProps) {
  const [otp, setOTP] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  // Format mobile number for display
  const formatDisplayMobile = (mobile: string) => {
    if (mobile.length === 10) {
      return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
    }
    return `+91 ${mobile}`;
  };

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Send OTP
  const sendOTP = useCallback(async (isResend = false) => {
    if (isResend) {
      setIsResending(true);
    }
    
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          mobile_number: mobile,
          purpose: isNewUser ? 'signup' : 'login'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      if (data.success) {
        setTimeLeft(300); // Reset timer
        setCanResend(false);
        setError('');
        
        if (isResend) {
          // Show success message for resend
          setTimeout(() => {
            // Could show a toast here
          }, 100);
        }
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      setError(error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setIsResending(false);
    }
  }, [mobile, isNewUser]);

  // Send OTP on component mount
  useEffect(() => {
    sendOTP();
  }, [sendOTP]);

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOTP(value);
    setError(''); // Clear error when user types
  };

  const handleResend = () => {
    if (canResend && !isResending) {
      sendOTP(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setError('Please enter a complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          mobile_number: mobile,
          otp: otp
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      if (data.success) {
        if (data.data.is_new_user) {
          // New user needs to complete registration
          onNeedRegistration(mobile);
        } else {
          // Existing user is logged in
          onOTPVerified(data.data.user);
        }
      } else {
        setError(data.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setError(error instanceof Error ? error.message : 'Verification failed. Please try again.');
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
          
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {isNewUser ? 'Verify Your Number' : 'Welcome Back!'}
          </CardTitle>
          <CardDescription>
            We've sent a 6-digit code to<br />
            <span className="font-semibold text-foreground">
              {formatDisplayMobile(mobile)}
            </span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium">
                Enter verification code
              </label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="123456"
                value={otp}
                onChange={handleOTPChange}
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || otp.length !== 6}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </Button>
          </form>

          <div className="text-center space-y-3">
            {timeLeft > 0 ? (
              <p className="text-sm text-gray-500">
                Code expires in {formatTime(timeLeft)}
              </p>
            ) : (
              <p className="text-sm text-red-500">
                Code expired
              </p>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={!canResend || isResending}
              className="text-sm"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Resend Code
                </>
              )}
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>Didn't receive the code? Check your messages or try resending</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
