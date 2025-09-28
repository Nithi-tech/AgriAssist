'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, RefreshCw } from 'lucide-react';

// Minimal fallback settings page
export default function FallbackSettingsPage() {
  const handleReload = () => {
    window.location.reload();
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
        
        {/* Basic Language Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              🌐 Language Preferences
            </h2>
            <div className="space-y-4">
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
                    className="h-12 flex items-center gap-2 justify-start"
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
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
                <Card key={index} className="bg-white shadow-md">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">{member.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{member.role}</p>
                    <p className="text-blue-600 text-sm font-mono">{member.phone}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              ⚡ Preferences
            </h2>
            <div className="space-y-4">
              {[
                { title: '🔔 Push Notifications', desc: 'Receive alerts about weather, crops, and diseases' },
                { title: '🌙 Dark Mode', desc: 'Switch to dark theme for better night viewing' },
                { title: '📅 Calendar Reminders', desc: 'Get reminders for farming activities and schedules' },
              ].map((pref, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">{pref.title}</h4>
                    <p className="text-sm text-gray-600">{pref.desc}</p>
                  </div>
                  <Button variant="outline" size="sm">Toggle</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reload Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🔄 Having Issues?</h3>
            <p className="text-gray-600 mb-4">If you're experiencing problems, try reloading the page.</p>
            <Button 
              onClick={handleReload}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Settings Page
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
