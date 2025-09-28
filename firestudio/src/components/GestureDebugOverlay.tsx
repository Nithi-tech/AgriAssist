'use client';

import React, { useState, useEffect } from 'react';
import { useGestureDetection } from '@/hooks/useGestureDetection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Bug, Eye, Activity } from 'lucide-react';

interface GestureDebugInfo {
  type: 'touchstart' | 'touchend' | 'touchmove' | 'gesture';
  fingerCount: number;
  tapCount?: number;
  distance?: number;
  deltaX?: number;
  deltaY?: number;
  deltaTime?: number;
  gesture?: string;
  timestamp: number;
}

interface GestureDebugOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onGestureAction?: (action: string) => void;
}

export const GestureDebugOverlay: React.FC<GestureDebugOverlayProps> = ({
  isVisible,
  onClose,
  onGestureAction
}) => {
  const [debugLogs, setDebugLogs] = useState<GestureDebugInfo[]>([]);
  const [gestureStats, setGestureStats] = useState({
    totalGestures: 0,
    tapGestures: 0,
    swipeGestures: 0,
    multiFingerGestures: 0,
    lastGesture: 'None',
    currentFingerCount: 0,
    currentTapCount: 0
  });

  const addDebugLog = (info: GestureDebugInfo) => {
    setDebugLogs(prev => [info, ...prev.slice(0, 19)]); // Keep last 20 entries
    
    // Update stats
    setGestureStats(prev => {
      const newStats = { ...prev };
      
      if (info.type === 'touchstart' || info.type === 'touchend') {
        newStats.currentFingerCount = info.fingerCount;
      }
      
      if (info.type === 'gesture' && info.gesture) {
        newStats.totalGestures++;
        newStats.lastGesture = info.gesture;
        
        if (info.gesture.includes('Tap')) {
          newStats.tapGestures++;
          newStats.currentTapCount = info.tapCount || 0;
        }
        if (info.gesture.includes('Swipe')) {
          newStats.swipeGestures++;
        }
        if (info.gesture.includes('Finger')) {
          newStats.multiFingerGestures++;
        }
        
        // Trigger action callback
        onGestureAction?.(info.gesture);
      }
      
      return newStats;
    });
  };

  const clearLogs = () => {
    setDebugLogs([]);
    setGestureStats({
      totalGestures: 0,
      tapGestures: 0,
      swipeGestures: 0,
      multiFingerGestures: 0,
      lastGesture: 'None',
      currentFingerCount: 0,
      currentTapCount: 0
    });
  };

  // Test gesture handlers
  const { clearTouchData } = useGestureDetection({
    onSingleTap: () => addDebugLog({ type: 'gesture', fingerCount: 1, gesture: 'Single Tap', timestamp: Date.now() }),
    onDoubleTap: () => addDebugLog({ type: 'gesture', fingerCount: 1, gesture: 'Double Tap', timestamp: Date.now() }),
    onTripleTap: () => addDebugLog({ type: 'gesture', fingerCount: 1, gesture: 'Triple Tap', timestamp: Date.now() }),
    onFourTap: () => addDebugLog({ type: 'gesture', fingerCount: 1, gesture: 'Four Tap', timestamp: Date.now() }),
    onFiveTap: () => addDebugLog({ type: 'gesture', fingerCount: 1, gesture: 'Five Tap', timestamp: Date.now() }),
    onSixTap: () => addDebugLog({ type: 'gesture', fingerCount: 1, gesture: 'Six Tap', timestamp: Date.now() }),
    onSwipeDown: () => addDebugLog({ type: 'gesture', fingerCount: 1, gesture: 'Swipe Down', timestamp: Date.now() }),
    onSwipeUp: () => addDebugLog({ type: 'gesture', fingerCount: 1, gesture: 'Swipe Up', timestamp: Date.now() }),
    onSwipeLeft: () => addDebugLog({ type: 'gesture', fingerCount: 1, gesture: 'Swipe Left', timestamp: Date.now() }),
    onSwipeRight: () => addDebugLog({ type: 'gesture', fingerCount: 1, gesture: 'Swipe Right', timestamp: Date.now() }),
    onTwoFingerDragDown: () => addDebugLog({ type: 'gesture', fingerCount: 2, gesture: 'Two Finger Drag Down (Assistant)', timestamp: Date.now() }),
    onDebugLog: addDebugLog
  });

  const getLogColor = (log: GestureDebugInfo) => {
    switch (log.type) {
      case 'touchstart': return 'bg-green-100 text-green-800';
      case 'touchend': return 'bg-red-100 text-red-800';
      case 'touchmove': return 'bg-blue-100 text-blue-800';
      case 'gesture': 
        if (log.gesture?.includes('Finger')) return 'bg-purple-100 text-purple-800';
        if (log.gesture?.includes('Swipe')) return 'bg-orange-100 text-orange-800';
        return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLogDetails = (log: GestureDebugInfo) => {
    const details = [];
    if (log.fingerCount !== undefined) details.push(`👆 ${log.fingerCount}`);
    if (log.tapCount !== undefined) details.push(`Taps: ${log.tapCount}`);
    if (log.distance !== undefined) details.push(`Dist: ${Math.round(log.distance)}px`);
    if (log.deltaX !== undefined) details.push(`ΔX: ${Math.round(log.deltaX)}`);
    if (log.deltaY !== undefined) details.push(`ΔY: ${Math.round(log.deltaY)}`);
    if (log.deltaTime !== undefined) details.push(`Time: ${log.deltaTime}ms`);
    return details.join(' • ');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black bg-opacity-70 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[95vh] overflow-hidden bg-white shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Bug className="h-6 w-6" />
              <CardTitle className="text-xl">🎯 Gesture Debug Console</CardTitle>
            </div>
            <Button 
              onClick={onClose}
              variant="outline"
              size="sm"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 overflow-y-auto max-h-[80vh]">
          {/* Current Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{gestureStats.currentFingerCount}</div>
              <div className="text-sm text-blue-600">Current Fingers</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">{gestureStats.currentTapCount}</div>
              <div className="text-sm text-green-600">Current Tap Count</div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-700">{gestureStats.totalGestures}</div>
              <div className="text-sm text-orange-600">Total Gestures</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-sm font-bold text-purple-700 truncate">{gestureStats.lastGesture}</div>
              <div className="text-xs text-purple-600">Last Gesture</div>
            </div>
          </div>

          {/* Gesture Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-xl font-bold text-emerald-600">{gestureStats.tapGestures}</div>
              <div className="text-sm text-gray-600">Tap Gestures</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">{gestureStats.swipeGestures}</div>
              <div className="text-sm text-gray-600">Swipe Gestures</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">{gestureStats.multiFingerGestures}</div>
              <div className="text-sm text-gray-600">Multi-Finger</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3 mb-6">
            <Button onClick={clearLogs} variant="outline" size="sm">
              Clear Logs
            </Button>
            <Button onClick={clearTouchData} variant="outline" size="sm">
              Reset Touch State
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2 flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Debug Instructions:
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Perform gestures anywhere on this overlay</li>
              <li>• Watch real-time finger count and tap tracking</li>
              <li>• Check logs below for detailed touch events</li>
              <li>• Verify each gesture triggers correctly</li>
              <li>• Test two-finger drag down for Assistant</li>
            </ul>
          </div>

          {/* Debug Log */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Debug Log ({debugLogs.length}/20)
              </h3>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
              {debugLogs.length === 0 ? (
                <p className="text-gray-500 text-center italic">
                  No events yet. Perform gestures to see debug information.
                </p>
              ) : (
                <div className="space-y-2">
                  {debugLogs.map((log, index) => (
                    <div 
                      key={`${log.timestamp}-${index}`}
                      className="flex justify-between items-start bg-white p-3 rounded border border-gray-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={`text-xs ${getLogColor(log)}`}>
                            {log.type === 'gesture' && log.gesture ? log.gesture : log.type}
                          </Badge>
                          {log.type === 'gesture' && log.gesture === 'Two Finger Drag Down (Assistant)' && (
                            <Badge className="text-xs bg-red-100 text-red-800">🤖 ASSISTANT</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatLogDetails(log)}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(log.timestamp).toLocaleTimeString()}.{log.timestamp % 1000}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Warning */}
          <div className="mt-6 bg-red-50 p-3 rounded border border-red-200">
            <p className="text-xs text-red-800">
              ⚠️ Debug Mode Active: This overlay captures all touch events for testing. Close before normal use.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
