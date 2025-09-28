import { useEffect, useRef, useCallback } from 'react';

export interface GestureHandlers {
  onSingleTap?: () => void;
  onDoubleTap?: () => void;
  onTripleTap?: () => void;
  onFourTap?: () => void;
  onSwipeDown?: () => void;
  onSwipeUp?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTwoFingerDragDown?: () => void;
  onDebugLog?: (log: GestureDebugInfo) => void;
  // Debug keyboard shortcuts for laptop testing
  enableKeyboardShortcuts?: boolean;
}

export interface TouchInfo {
  x: number;
  y: number;
  time: number;
  identifier: number;
}

export interface GestureDebugInfo {
  type: 'touchstart' | 'touchend' | 'touchmove' | 'gesture' | 'keyboard';
  fingerCount: number;
  tapCount?: number;
  distance?: number;
  deltaX?: number;
  deltaY?: number;
  deltaTime?: number;
  gesture?: string;
  timestamp: number;
}

export const useGestureDetection = (handlers: GestureHandlers) => {
  const tapCount = useRef(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartData = useRef<Map<number, TouchInfo>>(new Map());
  const gestureInProgress = useRef(false);
  const lastGestureTime = useRef(0);
  const containerRef = useRef<HTMLElement | null>(null);
  const lastTapPosition = useRef<{ x: number; y: number } | null>(null);

  // Configuration constants - OPTIMIZED for reliability
  const MULTI_TAP_DELAY = 400; // ms - time to wait for additional taps
  const TAP_THRESHOLD = 15; // pixels - max movement for tap
  const SWIPE_THRESHOLD = 60; // pixels - min movement for swipe
  const TWO_FINGER_THRESHOLD = 2; // exactly 2 fingers for assistant
  const GESTURE_DEBOUNCE = 200; // ms - prevent rapid-fire gestures
  const MAX_TAP_DURATION = 300; // ms - max time for a tap
  const MIN_DRAG_DURATION = 250; // ms - min time for drag gesture
  const TAP_POSITION_THRESHOLD = 25; // pixels - max distance between sequential taps

  const debugLog = useCallback((info: GestureDebugInfo) => {
    if (handlers.onDebugLog) {
      handlers.onDebugLog(info);
    }
  }, [handlers]);

  const resetTapCount = useCallback(() => {
    tapCount.current = 0;
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
    }
  }, []);

  const isGestureDebounced = useCallback(() => {
    const now = Date.now();
    if (now - lastGestureTime.current < GESTURE_DEBOUNCE) {
      return true;
    }
    lastGestureTime.current = now;
    return false;
  }, []);

  const executeGesture = useCallback((gesture: string, handler?: () => void) => {
    if (isGestureDebounced() || gestureInProgress.current) {
      debugLog({
        type: 'gesture',
        fingerCount: 0,
        gesture: `BLOCKED: ${gesture}`,
        timestamp: Date.now()
      });
      return;
    }
    
    gestureInProgress.current = true;
    
    debugLog({
      type: 'gesture',
      fingerCount: 0,
      gesture,
      timestamp: Date.now()
    });
    
    console.log(`🎯 Gesture executed: ${gesture}`);
    
    // Execute the handler
    if (handler) {
      try {
        handler();
      } catch (error) {
        console.error('Gesture handler error:', error);
      }
    }
    
    // Reset state after a brief delay
    setTimeout(() => {
      gestureInProgress.current = false;
    }, 150);
  }, [isGestureDebounced, debugLog]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const now = Date.now();
    const touches = Array.from(e.touches);
    
    debugLog({
      type: 'touchstart',
      fingerCount: touches.length,
      timestamp: now
    });
    
    // Clear previous touch data if this is a fresh gesture
    if (touches.length === 1 && touchStartData.current.size === 0) {
      gestureInProgress.current = false;
    }
    
    // Store touch data for each finger
    touches.forEach(touch => {
      if (!touchStartData.current.has(touch.identifier)) {
        touchStartData.current.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY,
          time: now,
          identifier: touch.identifier
        });
      }
    });
  }, [debugLog]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (gestureInProgress.current) {
      return;
    }
    
    const now = Date.now();
    const remainingTouches = e.touches.length;
    const changedTouches = Array.from(e.changedTouches);
    
    debugLog({
      type: 'touchend',
      fingerCount: remainingTouches,
      timestamp: now
    });

    // Process the most relevant changed touch
    const touch = changedTouches[0];
    if (!touch) return;
    
    const startData = touchStartData.current.get(touch.identifier);
    if (!startData) {
      touchStartData.current.delete(touch.identifier);
      return;
    }

    const deltaX = touch.clientX - startData.x;
    const deltaY = touch.clientY - startData.y;
    const deltaTime = now - startData.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const fingersInvolved = touchStartData.current.size;
    
    debugLog({
      type: 'gesture',
      fingerCount: fingersInvolved,
      distance,
      deltaX,
      deltaY,
      deltaTime,
      timestamp: now
    });

    // PRIORITY 1: Two-finger drag down (AI Assistant)
    if (fingersInvolved === TWO_FINGER_THRESHOLD && remainingTouches === 0) {
      if (deltaY > SWIPE_THRESHOLD && 
          Math.abs(deltaX) < SWIPE_THRESHOLD && 
          deltaTime > MIN_DRAG_DURATION) {
        
        executeGesture('Two Finger Drag Down → AI Assistant', handlers.onTwoFingerDragDown);
        touchStartData.current.clear();
        resetTapCount();
        return;
      }
    }

    // PRIORITY 2: Single-finger gestures (only when all touches are released)
    if (fingersInvolved === 1 && remainingTouches === 0) {
      
      // Check for swipe gestures first (they take priority over taps)
      if (distance > SWIPE_THRESHOLD && deltaTime < 800) {
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          // Vertical swipe
          if (deltaY > 0) {
            executeGesture('Swipe Down → Market Prices', handlers.onSwipeDown);
          } else {
            executeGesture('Swipe Up', handlers.onSwipeUp);
          }
        } else {
          // Horizontal swipe
          if (deltaX > 0) {
            executeGesture('Swipe Right', handlers.onSwipeRight);
          } else {
            executeGesture('Swipe Left', handlers.onSwipeLeft);
          }
        }
        touchStartData.current.clear();
        resetTapCount();
        return;
      }

      // Check for tap gestures (small movement and quick duration)
      if (distance < TAP_THRESHOLD && deltaTime < MAX_TAP_DURATION) {
        const currentPosition = { x: touch.clientX, y: touch.clientY };
        
        // Check if this tap is close to the previous one (for multi-tap sequences)
        let isValidTap = true;
        if (lastTapPosition.current) {
          const tapDistance = Math.sqrt(
            Math.pow(currentPosition.x - lastTapPosition.current.x, 2) + 
            Math.pow(currentPosition.y - lastTapPosition.current.y, 2)
          );
          isValidTap = tapDistance < TAP_POSITION_THRESHOLD;
        }

        if (isValidTap) {
          tapCount.current++;
          lastTapPosition.current = currentPosition;
          
          debugLog({
            type: 'gesture',
            fingerCount: 1,
            tapCount: tapCount.current,
            timestamp: now
          });
          
          // Clear existing timer
          if (tapTimer.current) {
            clearTimeout(tapTimer.current);
          }
          
          // Set timer to process the tap sequence
          tapTimer.current = setTimeout(() => {
            if (gestureInProgress.current) {
              return;
            }
            
            const currentTapCount = tapCount.current;
            
            // Execute appropriate tap gesture
            switch (currentTapCount) {
              case 1:
                executeGesture('Single Tap → Crop Recommendation', handlers.onSingleTap);
                break;
              case 2:
                executeGesture('Double Tap → Disease Diagnosis', handlers.onDoubleTap);
                break;
              case 3:
                executeGesture('Triple Tap → Weather Forecast', handlers.onTripleTap);
                break;
              case 4:
              default:
                executeGesture('Four Taps → Government Schemes', handlers.onFourTap);
                break;
            }
            
            resetTapCount();
            lastTapPosition.current = null;
          }, MULTI_TAP_DELAY);
        } else {
          // Reset tap sequence if tap is too far from previous
          resetTapCount();
          tapCount.current = 1;
          lastTapPosition.current = currentPosition;
          
          tapTimer.current = setTimeout(() => {
            if (!gestureInProgress.current && tapCount.current === 1) {
              executeGesture('Single Tap → Crop Recommendation', handlers.onSingleTap);
            }
            resetTapCount();
            lastTapPosition.current = null;
          }, MULTI_TAP_DELAY);
        }
      }
    }

    // Clean up processed touch
    touchStartData.current.delete(touch.identifier);
  }, [handlers, debugLog, executeGesture, resetTapCount]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Log movement for debugging
    const now = Date.now();
    debugLog({
      type: 'touchmove',
      fingerCount: e.touches.length,
      timestamp: now
    });
  }, [debugLog]);

  const attachListeners = useCallback((element: HTMLElement) => {
    containerRef.current = element;
    
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
  }, [handleTouchStart, handleTouchEnd, handleTouchMove]);

  const removeListeners = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.removeEventListener('touchstart', handleTouchStart);
      containerRef.current.removeEventListener('touchend', handleTouchEnd);
      containerRef.current.removeEventListener('touchmove', handleTouchMove);
    }
  }, [handleTouchStart, handleTouchEnd, handleTouchMove]);

  // Keyboard event handler for laptop testing
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!handlers.enableKeyboardShortcuts) {
      return;
    }
    
    // Prevent default behavior for our debug keys
    const debugKeys = ['1', '2', '3', '4', '5'];
    if (debugKeys.includes(e.key) || (e.shiftKey && e.key.toLowerCase() === 'a')) {
      e.preventDefault();
      e.stopPropagation();
    }

    debugLog({
      type: 'keyboard',
      fingerCount: 0,
      gesture: `Keyboard: ${e.key}${e.shiftKey ? ' (Shift)' : ''}`,
      timestamp: Date.now()
    });

    // Handle keyboard shortcuts for testing
    switch (e.key) {
      case '1':
        executeGesture('Keyboard: Single Tap (Key 1) → Crop Recommendation', handlers.onSingleTap);
        break;
      case '2':
        executeGesture('Keyboard: Double Tap (Key 2) → Disease Diagnosis', handlers.onDoubleTap);
        break;
      case '3':
        executeGesture('Keyboard: Triple Tap (Key 3) → Weather Forecast', handlers.onTripleTap);
        break;
      case '4':
        executeGesture('Keyboard: Four Taps (Key 4) → Government Schemes', handlers.onFourTap);
        break;
      case '5':
        executeGesture('Keyboard: Swipe Down (Key 5) → Market Prices', handlers.onSwipeDown);
        break;
      case 'A':
      case 'a':
        if (e.shiftKey) {
          executeGesture('Keyboard: Two-Finger Drag (Shift+A) → AI Assistant', handlers.onTwoFingerDragDown);
        }
        break;
    }
  }, [handlers, executeGesture, debugLog]);

  useEffect(() => {
    // Auto-attach to document.body for gesture detection
    const element = document.body;
    attachListeners(element);

    // Add keyboard event listeners for debug shortcuts
    if (handlers.enableKeyboardShortcuts) {
      console.log('🎹 Keyboard shortcuts enabled for development testing');
      console.log('Keys: 1-5 for gestures, Shift+A for AI Assistant');
      
      // Ensure the page can receive keyboard events
      if (document.body.tabIndex < 0) {
        document.body.tabIndex = 0;
      }
      
      document.addEventListener('keydown', handleKeyDown, { 
        capture: true,
        passive: false
      });
    }

    return () => {
      removeListeners();
      if (tapTimer.current) {
        clearTimeout(tapTimer.current);
      }
      
      // Remove keyboard listeners
      if (handlers.enableKeyboardShortcuts) {
        document.removeEventListener('keydown', handleKeyDown, { capture: true });
      }
    };
  }, [attachListeners, removeListeners, handlers.enableKeyboardShortcuts, handleKeyDown]);

  return {
    resetTapCount,
    clearTouchData: () => {
      touchStartData.current.clear();
      gestureInProgress.current = false;
      resetTapCount();
      lastTapPosition.current = null;
      console.log('🔄 Touch data cleared');
    },
    attachListeners,
    removeListeners,
    isGestureInProgress: () => gestureInProgress.current
  };
};
