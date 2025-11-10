/**
 * Mobile-specific utility functions and hooks for AgriAssist
 */

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

// Touch gesture utilities
export const touchGestures = {
  isTouch: () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
  
  getTouchCoordinates: (event: TouchEvent) => {
    const touch = event.touches[0] || event.changedTouches[0];
    return {
      x: touch.clientX,
      y: touch.clientY
    };
  },
  
  // Swipe detection
  detectSwipe: (startTouch: Touch, endTouch: Touch, threshold = 50) => {
    const deltaX = endTouch.clientX - startTouch.clientX;
    const deltaY = endTouch.clientY - startTouch.clientY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > threshold) {
        return deltaX > 0 ? 'right' : 'left';
      }
    } else {
      if (Math.abs(deltaY) > threshold) {
        return deltaY > 0 ? 'down' : 'up';
      }
    }
    return null;
  }
};

// Responsive breakpoints
export const breakpoints = {
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  
  isMobile: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  },
  
  isTablet: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 769px) and (max-width: 1024px)').matches;
  },
  
  isDesktop: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1025px)').matches;
  }
};

// Device detection hook
export function useDeviceDetection() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isNative: false,
    platform: 'web' as 'web' | 'ios' | 'android'
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const isMobile = breakpoints.isMobile();
      const isTablet = breakpoints.isTablet();
      const isDesktop = breakpoints.isDesktop();
      const isNative = Capacitor.isNativePlatform();
      const platform = Capacitor.getPlatform() as 'web' | 'ios' | 'android';

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isNative,
        platform
      });
    };

    updateDeviceInfo();
    
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    mediaQuery.addEventListener('change', updateDeviceInfo);
    
    return () => mediaQuery.removeEventListener('change', updateDeviceInfo);
  }, []);

  return deviceInfo;
}

// Safe area utilities
export const safeAreaUtils = {
  getCSSVars: () => ({
    '--sat': 'env(safe-area-inset-top)',
    '--sar': 'env(safe-area-inset-right)', 
    '--sab': 'env(safe-area-inset-bottom)',
    '--sal': 'env(safe-area-inset-left)'
  }),
  
  getSafeAreaInsets: () => {
    if (typeof window === 'undefined') {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }
    
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      top: parseInt(computedStyle.getPropertyValue('--sat') || '0'),
      right: parseInt(computedStyle.getPropertyValue('--sar') || '0'),
      bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0'),
      left: parseInt(computedStyle.getPropertyValue('--sal') || '0')
    };
  }
};

// Mobile-optimized loading states
export function useMobileLoading(initialLoading = false) {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [loadingText, setLoadingText] = useState('Loading...');

  const startLoading = (text = 'Loading...') => {
    setLoadingText(text);
    setIsLoading(true);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  return {
    isLoading,
    loadingText,
    startLoading,
    stopLoading
  };
}

// Haptic feedback (mobile only)
export const haptics = {
  light: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.log('Haptic feedback not available');
      }
    }
  },
  
  medium: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch (error) {
        console.log('Haptic feedback not available');
      }
    }
  },
  
  heavy: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } catch (error) {
        console.log('Haptic feedback not available');
      }
    }
  },
  
  vibrate: (duration = 100) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }
};

// Mobile-optimized image handling
export const mobileImageUtils = {
  getOptimizedImageSize: (originalWidth: number, originalHeight: number, maxWidth = 800) => {
    if (originalWidth <= maxWidth) {
      return { width: originalWidth, height: originalHeight };
    }
    
    const ratio = maxWidth / originalWidth;
    return {
      width: maxWidth,
      height: Math.round(originalHeight * ratio)
    };
  },
  
  compressImage: (file: File, quality = 0.8, maxWidth = 800): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const { width, height } = mobileImageUtils.getOptimizedImageSize(
          img.width, 
          img.height, 
          maxWidth
        );
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => resolve(blob!),
          'image/jpeg',
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
};

// Keyboard handling for mobile
export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      // Simple heuristic: if viewport height decreased significantly, keyboard is likely open
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const screenHeight = window.screen.height;
      const heightDiff = screenHeight - viewportHeight;
      
      // Threshold to detect keyboard (adjust as needed)
      setKeyboardHeight(heightDiff > 150 ? heightDiff : 0);
    };
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  return keyboardHeight;
}

// Performance utilities for mobile
export const mobilePerformance = {
  // Debounce for touch events
  debounce: <T extends (...args: any[]) => void>(func: T, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },
  
  // Throttle for scroll events
  throttle: <T extends (...args: any[]) => void>(func: T, limit: number) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // Lazy loading intersection observer
  createLazyLoader: (callback: (entry: IntersectionObserverEntry) => void, options = {}) => {
    return new IntersectionObserver((entries) => {
      entries.forEach(callback);
    }, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    });
  }
};