'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface MobileContextType {
  isMobile: boolean;
  isNative: boolean;
  deviceInfo: any;
  orientation: 'portrait' | 'landscape';
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

const MobileContext = createContext<MobileContextType | undefined>(undefined);

export function MobileProvider({ children }: { children: React.ReactNode }) {
  const [deviceInfo, setDeviceInfo] = useState<any>({
    isMobile: false,
    isNative: false,
    platform: 'web'
  });
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  // Calculate if mobile based on device info
  const isMobile = typeof window !== 'undefined' 
    ? window.matchMedia('(max-width: 768px)').matches 
    : false;

  const isNative = typeof window !== 'undefined' 
    ? window.location.protocol === 'capacitor:' 
    : false;

  useEffect(() => {
    const initializeDevice = async () => {
      try {
        if (typeof window !== 'undefined') {
          // Basic device detection
          const isMobileDevice = window.matchMedia('(max-width: 768px)').matches;
          const isNativeApp = window.location.protocol === 'capacitor:';
          
          setDeviceInfo({
            isMobile: isMobileDevice,
            isNative: isNativeApp,
            platform: isNativeApp ? 'native' : 'web'
          });

          // Set up orientation listener
          const updateOrientation = () => {
            setOrientation(
              window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
            );
          };

          updateOrientation();
          window.addEventListener('orientationchange', updateOrientation);
          window.addEventListener('resize', updateOrientation);

          return () => {
            window.removeEventListener('orientationchange', updateOrientation);
            window.removeEventListener('resize', updateOrientation);
          };
        }
      } catch (error) {
        console.log('Device initialization failed:', error);
      }
    };

    initializeDevice();
  }, []);

  const value: MobileContextType = {
    isMobile,
    isNative,
    deviceInfo,
    orientation,
    safeAreaInsets,
  };

  return (
    <MobileContext.Provider value={value}>
      {children}
    </MobileContext.Provider>
  );
}

export function useMobile() {
  const context = useContext(MobileContext);
  if (context === undefined) {
    throw new Error('useMobile must be used within a MobileProvider');
  }
  return context;
}