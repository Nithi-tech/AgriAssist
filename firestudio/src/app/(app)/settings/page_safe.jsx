'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Settings...</p>
      </div>
    </div>
  );
}

// Error boundary component
function ErrorBoundary({ children, fallback }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (event) => {
      console.error('Settings page error:', event.error);
      setHasError(true);
      setError(event.error?.message || 'Unknown error occurred');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (hasError) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-4">Settings Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}

// Main settings content
function SettingsContent() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingSpinner />;
  }

  const handleLanguageSelect = (langCode, langName) => {
    toast({
      title: '🌐 Language Updated',
      description: `Switched to ${langName}`,
      duration: 3000,
    });
  };

  const handleToggle = (feature) => {
    toast({
      title: '✅ Setting Updated',
      description: `${feature} preference updated`,
      duration: 2000,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-green-100 shadow-sm">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl shadow-lg">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                ⚙️ Settings
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your account, preferences, and team here.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        
        {/* Language Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              🌐 Language Preferences
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { code: 'en', name: 'English', flag: '🇺🇸' },
                { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
                { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
                { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
                { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
                { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
              ].map((lang) => (
                <Button
                  key={lang.code}
                  variant="outline"
                  onClick={() => handleLanguageSelect(lang.code, lang.name)}
                  className="h-12 flex items-center gap-3 justify-start hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              👥 Our Expert Team
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'NITHIVALAVAN N', role: '🌾 Agricultural Expert', phone: '+917449062509' },
                { name: 'MOHAMED ASKAR S', role: '🔬 Crop Specialist', phone: '+917373362186' },
                { name: 'NAVINKUMAR J', role: '🌿 Plant Pathologist', phone: '+919087354031' },
                { name: 'BHARATHRAJ', role: '🌱 Soil Scientist', phone: '+919443795865' },
                { name: 'JAYARAJ', role: '📱 Tech Support', phone: '+918300714197' },
              ].map((member, index) => (
                <Card key={index} className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">{member.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{member.role}</p>
                    <div className="flex items-center justify-center gap-2">
                      <Button size="sm" variant="outline" className="text-blue-600">
                        📞 Call
                      </Button>
                      <Button size="sm" variant="outline" className="text-green-600">
                        💬 WhatsApp
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              ⚡ App Preferences
            </h2>
            <div className="space-y-4">
              {[
                { id: 'notifications', title: '🔔 Push Notifications', desc: 'Receive alerts about weather, crops, and diseases' },
                { id: 'dark-mode', title: '🌙 Dark Mode', desc: 'Switch to dark theme for better night viewing' },
                { id: 'reminders', title: '📅 Calendar Reminders', desc: 'Get reminders for farming activities and schedules' },
                { id: 'voice', title: '🎤 Voice Commands', desc: 'Enable voice input for hands-free operation' },
                { id: 'location', title: '📍 Location Services', desc: 'Allow location access for weather and local data' },
              ].map((pref) => (
                <div key={pref.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-blue-50 hover:to-blue-100 transition-all duration-300">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 text-lg mb-1">{pref.title}</h4>
                    <p className="text-gray-600">{pref.desc}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => handleToggle(pref.title)}
                    className="ml-4 min-w-[80px] hover:bg-green-50 hover:border-green-300"
                  >
                    Enable
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🌾 FireStudio Agriculture Platform</h3>
            <p className="text-gray-600 mb-4">
              Empowering farmers with AI-driven insights, real-time weather data, and expert agricultural guidance.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" size="sm">
                📖 User Guide
              </Button>
              <Button variant="outline" size="sm">
                🆘 Support
              </Button>
              <Button variant="outline" size="sm">
                💡 Feedback
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// Main export with error boundary
export default function SettingsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <SettingsContent />
      </Suspense>
    </ErrorBoundary>
  );
}
