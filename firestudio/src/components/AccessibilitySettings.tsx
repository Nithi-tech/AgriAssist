'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Eye, Volume2, Settings, Info, Accessibility } from 'lucide-react';

interface AccessibilitySettingsProps {
  onAccessibilityModeChange?: (enabled: boolean) => void;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  onAccessibilityModeChange
}) => {
  const [isGestureNavigationEnabled, setIsGestureNavigationEnabled] = useState(false);
  const [isAudioFeedbackEnabled, setIsAudioFeedbackEnabled] = useState(true);
  const [gestureInstructions, setGestureInstructions] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedGestureNavigation = localStorage.getItem('accessibility-gesture-navigation');
    const savedAudioFeedback = localStorage.getItem('accessibility-audio-feedback');
    
    if (savedGestureNavigation !== null) {
      setIsGestureNavigationEnabled(JSON.parse(savedGestureNavigation));
    }
    
    if (savedAudioFeedback !== null) {
      setIsAudioFeedbackEnabled(JSON.parse(savedAudioFeedback));
    }
  }, []);

  // Save settings to localStorage and notify parent component
  const handleGestureNavigationChange = (enabled: boolean) => {
    setIsGestureNavigationEnabled(enabled);
    localStorage.setItem('accessibility-gesture-navigation', JSON.stringify(enabled));
    onAccessibilityModeChange?.(enabled);
  };

  const handleAudioFeedbackChange = (enabled: boolean) => {
    setIsAudioFeedbackEnabled(enabled);
    localStorage.setItem('accessibility-audio-feedback', JSON.stringify(enabled));
  };

  const speakInstructions = () => {
    if ('speechSynthesis' in window && isAudioFeedbackEnabled) {
      const instructions = `
        Accessibility gesture instructions:
        On the dashboard, double tap anywhere to activate visually impaired mode.
        In visually impaired mode, use these gestures:
        Single tap for Crop Recommendation,
        Double tap for Disease Diagnosis,
        Triple tap for Weather,
        Four taps for Government Schemes,
        Swipe down for Market Prices,
        Swipe up for Farmer Community,
        Swipe left for Chat Support,
        Swipe right for Settings,
        Five taps for My Crops,
        Six taps for About,
        Three finger drag down for AI Assistant.
        Use the close button or tap X to exit the mode.
      `;
      
      const utterance = new SpeechSynthesisUtterance(instructions);
      utterance.rate = 0.7;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Accessibility className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-blue-800">Accessibility Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Gesture Navigation Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="gesture-navigation" className="text-sm font-medium text-gray-700">
                Touch Gesture Navigation
              </Label>
              <p className="text-xs text-gray-500">
                Enable double-tap to activate visually impaired mode on dashboard
              </p>
            </div>
            <Switch
              id="gesture-navigation"
              checked={isGestureNavigationEnabled}
              onCheckedChange={handleGestureNavigationChange}
            />
          </div>

          {/* Audio Feedback Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="audio-feedback" className="text-sm font-medium text-gray-700">
                Audio Feedback
              </Label>
              <p className="text-xs text-gray-500">
                Enable spoken instructions and feedback for navigation
              </p>
            </div>
            <Switch
              id="audio-feedback"
              checked={isAudioFeedbackEnabled}
              onCheckedChange={handleAudioFeedbackChange}
            />
          </div>

          {/* Instructions Button */}
          <div className="pt-4 border-t border-blue-200">
            <Button
              onClick={speakInstructions}
              disabled={!isAudioFeedbackEnabled}
              variant="outline"
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Volume2 className="mr-2 h-4 w-4" />
              Listen to Gesture Instructions
            </Button>
          </div>

          {/* Visual Instructions */}
          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-3">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">How to Use</span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p>1. Enable "Touch Gesture Navigation" above</p>
              <p>2. Go to the Dashboard page</p>
              <p>3. Double-tap anywhere on the screen</p>
              <p>4. Follow the audio instructions or visual guide</p>
              <p>5. Use gestures to navigate to different features</p>
            </div>
          </div>

          {/* Gesture Reference */}
          {gestureInstructions && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h4 className="text-sm font-medium text-gray-800 mb-3">Gesture Reference</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>• 1 tap → Crop Recommendation</div>
                <div>• 2 taps → Disease Diagnosis</div>
                <div>• 3 taps → Weather</div>
                <div>• 4 taps → Government Schemes</div>
                <div>• Swipe ↓ → Market Prices</div>
                <div>• Swipe ↑ → Farmer Community</div>
                <div>• Swipe ← → Chat Support</div>
                <div>• Swipe → → Settings</div>
                <div>• 5 taps → My Crops</div>
                <div>• 3-finger drag ↓ → AI Assistant</div>
              </div>
            </div> 
          )}

          <Button
            onClick={() => setGestureInstructions(!gestureInstructions)}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-800"
          >
            {gestureInstructions ? 'Hide' : 'Show'} Gesture Reference
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
