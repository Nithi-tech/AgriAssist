'use client';

import { useState, useEffect, useRef } from 'react';

interface DoubleTapDetectorProps {
  onDoubleTap: () => void;
  children: React.ReactNode;
  className?: string;
  enabled?: boolean;
}

export const DoubleTapDetector: React.FC<DoubleTapDetectorProps> = ({ 
  onDoubleTap, 
  children, 
  className,
  enabled = true
}) => {
  const tapCount = useRef(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapTime = useRef(0);

  const DOUBLE_TAP_DELAY = 400; // ms between taps
  const DOUBLE_TAP_THRESHOLD = 25; // max pixels movement between taps
  const MAX_TAP_DURATION = 300; // max time for a single tap
  const lastTapPosition = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enabled || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const now = Date.now();
    const currentPosition = { x: touch.clientX, y: touch.clientY };
    
    // Check if this tap is close to the previous one in time and space
    let isValidSequentialTap = true;
    if (lastTapPosition.current && (now - lastTapTime.current) < DOUBLE_TAP_DELAY) {
      const distance = Math.sqrt(
        Math.pow(currentPosition.x - lastTapPosition.current.x, 2) + 
        Math.pow(currentPosition.y - lastTapPosition.current.y, 2)
      );
      isValidSequentialTap = distance < DOUBLE_TAP_THRESHOLD;
    }

    if (isValidSequentialTap && (now - lastTapTime.current) < DOUBLE_TAP_DELAY) {
      tapCount.current++;
    } else {
      // Reset tap sequence if too much time has passed or tap is too far away
      tapCount.current = 1;
    }

    lastTapPosition.current = currentPosition;
    
    // Clear existing timer
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!enabled || e.changedTouches.length !== 1) return;
    
    e.preventDefault(); // Prevent click events and zoom
    
    const touch = e.changedTouches[0];
    const now = Date.now();
    
    // Calculate movement from start position
    if (lastTapPosition.current) {
      const distance = Math.sqrt(
        Math.pow(touch.clientX - lastTapPosition.current.x, 2) + 
        Math.pow(touch.clientY - lastTapPosition.current.y, 2)
      );
      
      // Only count as tap if movement is minimal and duration is short
      const tapDuration = now - lastTapTime.current;
      if (distance < DOUBLE_TAP_THRESHOLD && tapDuration < MAX_TAP_DURATION) {
        
        // Check for double tap
        if (tapCount.current >= 2) {
          console.log('🎯 Dashboard Double-tap detected → Activating Accessibility Mode');
          onDoubleTap();
          tapCount.current = 0;
          lastTapPosition.current = null;
          return;
        }
        
        // Set timer for single tap reset
        tapTimer.current = setTimeout(() => {
          tapCount.current = 0;
          lastTapPosition.current = null;
        }, DOUBLE_TAP_DELAY);
      } else {
        // Reset if movement was too large or duration too long
        tapCount.current = 0;
        lastTapPosition.current = null;
      }
    }
    
    lastTapTime.current = now;
  };

  // Mouse event handlers for laptop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enabled) return;
    
    const now = Date.now();
    const currentPosition = { x: e.clientX, y: e.clientY };
    
    // Check if this click is close to the previous one in time and space
    let isValidSequentialClick = true;
    if (lastTapPosition.current && (now - lastTapTime.current) < DOUBLE_TAP_DELAY) {
      const distance = Math.sqrt(
        Math.pow(currentPosition.x - lastTapPosition.current.x, 2) + 
        Math.pow(currentPosition.y - lastTapPosition.current.y, 2)
      );
      isValidSequentialClick = distance < DOUBLE_TAP_THRESHOLD;
    }

    if (isValidSequentialClick && (now - lastTapTime.current) < DOUBLE_TAP_DELAY) {
      tapCount.current++;
    } else {
      tapCount.current = 1;
    }

    lastTapPosition.current = currentPosition;
    
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!enabled) return;
    
    e.preventDefault();
    
    const now = Date.now();
    
    // Check for double click
    if (tapCount.current >= 2) {
      console.log('🖱️ Dashboard Double-click detected → Activating Accessibility Mode');
      onDoubleTap();
      tapCount.current = 0;
      lastTapPosition.current = null;
      return;
    }
    
    // Set timer for single click reset
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
      lastTapPosition.current = null;
    }, DOUBLE_TAP_DELAY);
    
    lastTapTime.current = now;
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (tapTimer.current) {
        clearTimeout(tapTimer.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{ 
        touchAction: 'manipulation', // Prevents zoom on double tap
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        cursor: 'default'
      }}
    >
      {children}
    </div>
  );
};
