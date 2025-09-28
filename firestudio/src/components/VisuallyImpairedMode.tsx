'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGestureDetection, GestureDebugInfo } from '@/hooks/useGestureDetection';
import { useRouter } from 'next/navigation';
import { 
  Sprout, 
  Stethoscope, 
  Cloud, 
  Landmark, 
  TrendingUp,
  X,
  Volume2,
  Bug,
  Activity
} from 'lucide-react';

interface VisuallyImpairedModeProps {
  onClose: () => void;
  enableKeyboardShortcuts?: boolean;
}

interface Feature {
  id: string;
  name: string;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const VisuallyImpairedMode: React.FC<VisuallyImpairedModeProps> = ({ 
  onClose, 
  enableKeyboardShortcuts = false 
}) => {
  const router = useRouter();
  const [currentFeature, setCurrentFeature] = useState<Feature | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);
  const [lastGestureAction, setLastGestureAction] = useState<string>('None');
  const [debugLogs, setDebugLogs] = useState<GestureDebugInfo[]>([]);
  const [gestureStats, setGestureStats] = useState({
    fingerCount: 0,
    tapCount: 0,
    totalGestures: 0,
    lastDistance: 0,
    lastDeltaX: 0,
    lastDeltaY: 0
  });
  const gestureAreaRef = useRef<HTMLDivElement>(null);

  // Define the features in exact order for gesture mapping
  const features: Feature[] = [
    {
      id: 'crop-recommendation',
      name: 'Crop Recommendation',
      route: '/crop-recommendation',
      icon: Sprout,
      description: 'Get personalized crop recommendations based on your soil and weather conditions'
    },
    {
      id: 'disease-diagnosis',
      name: 'Disease Diagnosis',
      route: '/disease-diagnosis',
      icon: Stethoscope,
      description: 'Diagnose plant diseases using camera and AI technology'
    },
    {
      id: 'weather',
      name: 'Weather Forecast',
      route: '/weather',
      icon: Cloud,
      description: 'Check current weather conditions and forecasts for farming'
    },
    {
      id: 'government-schemes',
      name: 'Government Schemes',
      route: '/government-schemes',
      icon: Landmark,
      description: 'Explore government welfare schemes and subsidies for farmers'
    },
    {
      id: 'market-prices',
      name: 'Market Prices',
      route: '/market-prices',
      icon: TrendingUp,
      description: 'View current market prices for crops and agricultural products'
    }
  ];

  // Text-to-speech function for accessibility feedback
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any currently speaking utterance
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.volume = 0.9;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      
      console.log('🔊 Speaking:', text);
      speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported in this browser');
    }
  };

  // Navigate to a specific feature
  const navigateToFeature = (featureIndex: number) => {
    if (featureIndex >= 0 && featureIndex < features.length) {
      const feature = features[featureIndex];
      setCurrentFeature(feature);
      setLastGestureAction(`Navigating to ${feature.name}...`);
      
      const message = `Opening ${feature.name}. ${feature.description}. Please wait while we navigate to this feature.`;
      speak(message);
      
      console.log(`🎯 Navigating to: ${feature.name} (${feature.route})`);
      
      // Navigate after a delay to allow the speech to start
      setTimeout(() => {
        try {
          router.push(feature.route);
        } catch (error) {
          console.error('Navigation error:', error);
          speak('Sorry, there was an error navigating to this feature. Please try again.');
          setCurrentFeature(null);
          setLastGestureAction('Navigation failed');
        }
      }, 2000);
    } else {
      speak('Invalid feature selection. Please try again.');
      setLastGestureAction('Invalid feature');
    }
  };

  // AI Assistant function
  const openAssistant = () => {
    setIsListening(true);
    setLastGestureAction('AI Assistant Activated');
    
    const message = 'AI Assistant activated. How can I help you with farming today? I can provide information about crops, weather, market prices, or farming techniques.';
    speak(message);
    
    console.log('🤖 AI Assistant activated');
    
    // Simulate assistant activation process
    setTimeout(() => {
      setIsListening(false);
      const readyMessage = 'Assistant is ready to help. You can ask me anything about farming, agriculture, or use the close button to return to the main menu.';
      speak(readyMessage);
    }, 3000);
  };

  // Handle debug logging
  const handleDebugLog = (log: GestureDebugInfo) => {
    setDebugLogs(prev => [log, ...prev.slice(0, 19)]); // Keep last 20 entries
    
    // Update gesture statistics
    setGestureStats(prev => ({
      ...prev,
      fingerCount: log.fingerCount || 0,
      tapCount: log.tapCount || prev.tapCount,
      totalGestures: log.type === 'gesture' && log.gesture ? prev.totalGestures + 1 : prev.totalGestures,
      lastDistance: log.distance || prev.lastDistance,
      lastDeltaX: log.deltaX || prev.lastDeltaX,
      lastDeltaY: log.deltaY || prev.lastDeltaY
    }));
  };

  // Gesture handlers with exact mapping as required
  const { clearTouchData, isGestureInProgress } = useGestureDetection({
    onSingleTap: () => {
      console.log('👆 Single Tap → Crop Recommendation');
      setLastGestureAction('Single Tap → Crop Recommendation');
      navigateToFeature(0); // Feature 1: Crop Recommendation
    },
    onDoubleTap: () => {
      console.log('👆👆 Double Tap → Disease Diagnosis');
      setLastGestureAction('Double Tap → Disease Diagnosis');
      navigateToFeature(1); // Feature 2: Disease Diagnosis
    },
    onTripleTap: () => {
      console.log('👆👆👆 Triple Tap → Weather Forecast');
      setLastGestureAction('Triple Tap → Weather Forecast');
      navigateToFeature(2); // Feature 3: Weather
    },
    onFourTap: () => {
      console.log('👆👆👆👆 Four Taps → Government Schemes');
      setLastGestureAction('Four Taps → Government Schemes');
      navigateToFeature(3); // Feature 4: Government Schemes
    },
    onSwipeDown: () => {
      console.log('👇 Swipe Down → Market Prices');
      setLastGestureAction('Swipe Down → Market Prices');
      navigateToFeature(4); // Feature 5: Market Prices
    },
    onTwoFingerDragDown: () => {
      console.log('👇👇 Two-Finger Drag → AI Assistant');
      setLastGestureAction('Two-Finger Drag → AI Assistant');
      openAssistant();
    },
    onDebugLog: handleDebugLog,
    enableKeyboardShortcuts: enableKeyboardShortcuts
  });

  // Announce instructions when mode is activated
  useEffect(() => {
    // Ensure the component can receive keyboard focus
    const handleClick = () => {
      if (document.body.tabIndex < 0) {
        document.body.tabIndex = 0;
      }
      document.body.focus();
    };
    
    // Add click listener to ensure focus
    document.addEventListener('click', handleClick);
    
    // Try to focus immediately
    handleClick();
    
    const instructions = `
      Welcome to Accessibility Mode! 
      You can use the following gestures to navigate:
      Single tap for Crop Recommendation,
      Double tap for Disease Diagnosis,
      Triple tap for Weather Forecast,
      Four taps for Government Schemes,
      Swipe down for Market Prices,
      Two finger drag down for AI Assistant.
      ${enableKeyboardShortcuts ? 'For testing, you can also use keyboard keys 1 through 5, or Shift plus A for the assistant.' : ''}
      Tap the close button in the top right to exit this mode.
    `.trim();
    
    console.log('🎯 Accessibility Mode activated');
    
    // Delay announcement to avoid overlap with other sounds
    setTimeout(() => {
      speak(instructions);
    }, 1000);
    
    return () => {
      document.removeEventListener('click', handleClick);
      // Cancel any ongoing speech when component unmounts
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    };
  }, [enableKeyboardShortcuts]);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col" role="application" aria-label="Visually Impaired Navigation Mode">
      {/* Header with close button and debug controls */}
      <div className="flex justify-between items-center p-4 bg-green-600 text-white">
        <div className="flex items-center space-x-2">
          <Volume2 className="h-6 w-6" />
          <h1 className="text-xl font-bold">Accessible Navigation</h1>
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => setShowDebugOverlay(!showDebugOverlay)}
              className="p-2 rounded bg-white/20 hover:bg-white/30 transition-colors ml-4"
              title="Toggle Debug Console"
            >
              <Bug className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {lastGestureAction !== 'None' && (
            <div className="text-sm bg-white/20 px-3 py-1 rounded-full max-w-xs truncate">
              {lastGestureAction}
            </div>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Close Visually Impaired Mode"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Debug overlay - only in development */}
      {showDebugOverlay && process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-900 text-white p-4 text-sm border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-blue-300">Fingers: {gestureStats.fingerCount}</div>
            </div>
            <div>
              <div className="text-green-300">Taps: {gestureStats.tapCount}</div>
            </div>
            <div>
              <div className="text-yellow-300">Distance: {Math.round(gestureStats.lastDistance)}px</div>
            </div>
            <div>
              <div className="text-purple-300">Gestures: {gestureStats.totalGestures}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-orange-300">ΔX: {Math.round(gestureStats.lastDeltaX)}px</div>
            </div>
            <div>
              <div className="text-pink-300">ΔY: {Math.round(gestureStats.lastDeltaY)}px</div>
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <button
              onClick={clearTouchData}
              className="px-3 py-1 bg-red-600 rounded text-xs"
            >
              Clear Touch Data
            </button>
            <button
              onClick={() => setDebugLogs([])}
              className="px-3 py-1 bg-yellow-600 rounded text-xs"
            >
              Clear Logs
            </button>
          </div>
          <div className="max-h-32 overflow-y-auto">
            <div className="text-xs">Recent Events:</div>
            {debugLogs.slice(0, 5).map((log, index) => (
              <div key={index} className="text-xs text-gray-300">
                {log.type}: {log.gesture || `${log.fingerCount} fingers`} 
                {log.distance && ` (${Math.round(log.distance)}px)`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main gesture area - FULL SCREEN INTERACTIVE AREA */}
      <div 
        ref={gestureAreaRef}
        className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-50 to-blue-50 touch-none relative"
        style={{
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          minHeight: '400px'
        }}
        role="application"
        aria-label="Gesture detection area for accessibility navigation"
        tabIndex={0}
      >
        {currentFeature ? (
          // Feature preview when navigating
          <div className="text-center space-y-6 max-w-md">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <currentFeature.icon className="h-16 w-16 mx-auto text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentFeature.name}</h2>
              <p className="text-gray-600">{currentFeature.description}</p>
            </div>
            <div className="animate-pulse">
              <p className="text-lg text-gray-700">Loading {currentFeature.name}...</p>
            </div>
          </div>
        ) : isListening ? (
          // AI Assistant listening state
          <div className="text-center space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="animate-pulse">
                <Volume2 className="h-16 w-16 mx-auto text-blue-600 mb-4" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">AI Assistant</h2>
              <p className="text-gray-600">Listening and ready to help with farming questions...</p>
            </div>
          </div>
        ) : (
          // Default state with visual instructions
          <div className="text-center space-y-8 max-w-2xl">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Touch Gesture Navigation</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-lg">1</div>
                    <div>
                      <div className="font-medium">Single Tap {enableKeyboardShortcuts && '(Key: 1)'}</div>
                      <div className="text-sm text-gray-600">Crop Recommendation</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-lg">2</div>
                    <div>
                      <div className="font-medium">Double Tap {enableKeyboardShortcuts && '(Key: 2)'}</div>
                      <div className="text-sm text-gray-600">Disease Diagnosis</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-lg">3</div>
                    <div>
                      <div className="font-medium">Triple Tap {enableKeyboardShortcuts && '(Key: 3)'}</div>
                      <div className="text-sm text-gray-600">Weather Forecast</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">4</div>
                    <div>
                      <div className="font-medium">Four Taps {enableKeyboardShortcuts && '(Key: 4)'}</div>
                      <div className="text-sm text-gray-600">Government Schemes</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">↓</div>
                    <div>
                      <div className="font-medium">Swipe Down {enableKeyboardShortcuts && '(Key: 5)'}</div>
                      <div className="text-sm text-gray-600">Market Prices</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xs">2👆</div>
                    <div>
                      <div className="font-medium">Two-Finger Drag Down {enableKeyboardShortcuts && '(Shift+A)'}</div>
                      <div className="text-sm text-gray-600">AI Assistant</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {enableKeyboardShortcuts && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-800 mb-2">🎹 Keyboard Shortcuts (Testing Mode)</h3>
                  <p className="text-sm text-blue-700">
                    Use keys 1-5 for features or Shift+A for AI Assistant when testing on laptop
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-lg text-gray-700 font-medium">
                🎯 Perform gestures anywhere on this screen
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Audio feedback will guide you through each action. Touch anywhere and try the gestures listed above.
              </p>
              {enableKeyboardShortcuts && (
                <p className="text-sm text-blue-600 mt-2 font-medium">
                  💻 Testing Mode: Use keys 1-5 or Shift+A to test gestures
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer with current mode indicator */}
      <div className="p-4 bg-gray-100 text-center">
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Activity className="h-4 w-4" />
            <span>Gesture Mode Active</span>
          </div>
          <div>•</div>
          <div>Audio Feedback: ON</div>
          {process.env.NODE_ENV === 'development' && showDebugOverlay && (
            <>
              <div>•</div>
              <div className="text-orange-600">Debug Mode: ON</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
