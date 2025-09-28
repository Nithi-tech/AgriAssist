'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginStart from '@/components/auth/login-start';
import LoginOTP from '@/components/auth/login-otp';
import SignUpForm from '@/components/auth/signup-form';

type AuthStep = 'start' | 'otp' | 'signup' | 'complete';

interface AuthState {
  step: AuthStep;
  mobile: string;
  isNewUser: boolean;
  userData?: any;
}

export default function AuthFlow() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    step: 'start',
    mobile: '',
    isNewUser: false
  });

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/profile', {
          credentials: 'include'
        });
        
        if (response.ok) {
          // User is already authenticated, redirect to dashboard
          router.push('/dashboard');
        }
      } catch (error) {
        // Not authenticated, continue with auth flow
        console.log('Not authenticated, showing auth flow');
      }
    };

    checkAuth();
  }, [router]);

  const handleMobileSubmit = (mobile: string, userExists: boolean) => {
    setAuthState({
      step: 'otp',
      mobile,
      isNewUser: !userExists
    });
  };

  const handleBack = () => {
    setAuthState({
      step: 'start',
      mobile: '',
      isNewUser: false
    });
  };

  const handleOTPVerified = (userData?: any) => {
    if (userData) {
      // Existing user logged in successfully
      setAuthState(prev => ({
        ...prev,
        step: 'complete',
        userData
      }));
      
      // Redirect to dashboard after a brief success message
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    }
  };

  const handleNeedRegistration = (mobile: string) => {
    setAuthState({
      step: 'signup',
      mobile,
      isNewUser: true
    });
  };

  const handleSignUpComplete = (userData: any) => {
    setAuthState(prev => ({
      ...prev,
      step: 'complete',
      userData
    }));

    // Redirect to dashboard after a brief success message
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  const handleBackFromSignup = () => {
    setAuthState(prev => ({
      ...prev,
      step: 'otp'
    }));
  };

  // Success screen
  if (authState.step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="text-center">
          <div className="mx-auto mb-4 p-4 bg-green-100 rounded-full w-fit">
            <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {authState.isNewUser ? 'Welcome to FireStudio!' : 'Welcome back!'}
          </h2>
          <p className="text-gray-600 mb-4">
            {authState.userData?.name && `Hello, ${authState.userData.name}!`}
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Render appropriate component based on current step
  switch (authState.step) {
    case 'start':
      return <LoginStart onMobileSubmit={handleMobileSubmit} />;
      
    case 'otp':
      return (
        <LoginOTP
          mobile={authState.mobile}
          isNewUser={authState.isNewUser}
          onBack={handleBack}
          onOTPVerified={handleOTPVerified}
          onNeedRegistration={handleNeedRegistration}
        />
      );
      
    case 'signup':
      return (
        <SignUpForm
          mobile={authState.mobile}
          onBack={handleBackFromSignup}
          onSignUpComplete={handleSignUpComplete}
        />
      );
      
    default:
      return <LoginStart onMobileSubmit={handleMobileSubmit} />;
  }
}
