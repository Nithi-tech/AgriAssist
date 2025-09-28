'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGestureDetection } from '@/hooks/useGestureDetection';
import { Badge } from '@/components/ui/badge';

/**
 * Accessibility Test Component
 * 
 * This component is for testing the gesture detection functionality
 * and can be used during development to verify that gestures work correctly.
 * 
 * To use this component:
 * 1. Add it to a test page or temporarily to the dashboard
 * 2. Enable the test mode
 * 3. Try different gestures and observe the feedback
 * 4. Check console logs for detailed gesture information
 */

interface GestureLog {
  id: number;
  gesture: string;
  timestamp: string;
  details?: string;
}

export const AccessibilityTestComponent: React.FC = () => {
  const [isTestMode, setIsTestMode] = useState(false);
  const [gestureLog, setGestureLog] = useState<GestureLog[]>([]);
  const [lastGesture, setLastGesture] = useState<string>('None');

  const logGesture = (gesture: string, details?: string) => {
    const newLog: GestureLog = {
      id: Date.now(),
      gesture,
      timestamp: new Date().toLocaleTimeString(),
      details
    };
    
    setLastGesture(gesture);
    setGestureLog(prev => [newLog, ...prev.slice(0, 9)]); // Keep last 10 entries
    
    // Console log for debugging
    console.log('🎯 Gesture Detected:', gesture, details || '');
    
    // Optional: Visual feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // Brief vibration if supported
    }
  };

  // Gesture handlers for testing
  useGestureDetection({
    onSingleTap: () => logGesture('Single Tap', 'Feature 1: Crop Recommendation'),
    onDoubleTap: () => logGesture('Double Tap', 'Feature 2: Disease Diagnosis'),
    onTripleTap: () => logGesture('Triple Tap', 'Feature 3: Weather'),
    onFourTap: () => logGesture('Four Tap', 'Feature 4: Government Schemes'),
    onFiveTap: () => logGesture('Five Tap', 'Feature 5: My Crops'),
    onSixTap: () => logGesture('Six Tap', 'Feature 6: About'),
    onSwipeDown: () => logGesture('Swipe Down', 'Feature: Market Prices'),
    onSwipeUp: () => logGesture('Swipe Up', 'Feature: Farmer Community'),
    onSwipeLeft: () => logGesture('Swipe Left', 'Feature: Chat Support'),
    onSwipeRight: () => logGesture('Swipe Right', 'Feature: Settings'),
    onThreeFingerDragDown: () => logGesture('Three Finger Drag Down', '🤖 AI Assistant'),
  });

  const clearLog = () => {
    setGestureLog([]);
    setLastGesture('None');
  };

  const getGestureColor = (gesture: string) => {
    if (gesture.includes('Tap')) return 'bg-green-100 text-green-800';
    if (gesture.includes('Swipe')) return 'bg-blue-100 text-blue-800';
    if (gesture.includes('Three Finger')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (!isTestMode) {
    return (
      <Card className="w-full max-w-md mx-auto border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800">🧪 Accessibility Test Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-orange-700 mb-4">
            Enable test mode to verify gesture detection functionality. 
            This is a development tool for testing the accessibility feature.
          </p>
          <Button 
            onClick={() => setIsTestMode(true)}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            Enable Test Mode
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <div className="flex justify-between items-center">
            <CardTitle>🧪 Gesture Detection Test</CardTitle>
            <Button 
              onClick={() => setIsTestMode(false)}
              variant="outline"
              size="sm"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              Close Test
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Current Status */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Last Detected Gesture:</p>
            <Badge 
              className={`text-lg px-4 py-2 ${getGestureColor(lastGesture)}`}
            >
              {lastGesture}
            </Badge>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">🎯 Test Instructions:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Try different tap counts (1-6 taps)</li>
              <li>• Try swiping in different directions</li>
              <li>• Try three-finger drag down gesture</li>
              <li>• Watch the gesture log below for feedback</li>
              <li>• Check browser console for detailed logs</li>
            </ul>
          </div>

          {/* Gesture Log */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">Gesture Log</h3>
              <Button 
                onClick={clearLog}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Clear Log
              </Button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
              {gestureLog.length === 0 ? (
                <p className="text-gray-500 text-center italic">
                  No gestures detected yet. Try performing gestures above!
                </p>
              ) : (
                <div className="space-y-2">
                  {gestureLog.map((log) => (
                    <div 
                      key={log.id}
                      className="flex justify-between items-start bg-white p-2 rounded border border-gray-200"
                    >
                      <div>
                        <Badge className={`text-xs ${getGestureColor(log.gesture)}`}>
                          {log.gesture}
                        </Badge>
                        {log.details && (
                          <p className="text-xs text-gray-600 mt-1">{log.details}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Test Statistics */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <div className="text-2xl font-bold text-green-700">
                {gestureLog.filter(g => g.gesture.includes('Tap')).length}
              </div>
              <div className="text-xs text-green-600">Tap Gestures</div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">
                {gestureLog.filter(g => g.gesture.includes('Swipe')).length}
              </div>
              <div className="text-xs text-blue-600">Swipe Gestures</div>
            </div>
            
            <div className="bg-purple-50 p-3 rounded border border-purple-200">
              <div className="text-2xl font-bold text-purple-700">
                {gestureLog.filter(g => g.gesture.includes('Three Finger')).length}
              </div>
              <div className="text-xs text-purple-600">Multi-finger</div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
            <p className="text-xs text-yellow-800">
              ⚠️ This is a development tool. Remove or hide this component in production.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
