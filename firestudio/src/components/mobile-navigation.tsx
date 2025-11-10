'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Leaf, 
  TrendingUp, 
  MessageCircle, 
  Camera, 
  Settings, 
  Menu, 
  X,
  ChevronRight,
  Bell,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMobile } from '@/providers/mobile-provider';
import { useOffline } from '@/providers/offline-provider';
import { usePWA } from '@/providers/pwa-provider';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  offline?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
    offline: true
  },
  {
    href: '/crop-analysis',
    label: 'Crop Analysis',
    icon: Leaf,
    offline: true
  },
  {
    href: '/market-prices',
    label: 'Market',
    icon: TrendingUp,
    offline: true
  },
  {
    href: '/camera',
    label: 'Camera',
    icon: Camera,
    offline: true
  },
  {
    href: '/community',
    label: 'Community',
    icon: MessageCircle,
    badge: 3
  }
];

export function MobileNavigation() {
  const pathname = usePathname();
  const { deviceInfo, safeAreaInsets } = useMobile();
  const { isOnline } = useOffline();
  const { isInstallable, installApp } = usePWA();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Handle hardware back button on Android
  useEffect(() => {
    const handleBackButton = () => {
      if (isMenuOpen) {
        setIsMenuOpen(false);
        return false; // Prevent default back action
      }
      return true; // Allow default back action
    };

    if (typeof window !== 'undefined' && 'addEventListener' in document) {
      document.addEventListener('backbutton', handleBackButton);
      return () => document.removeEventListener('backbutton', handleBackButton);
    }
  }, [isMenuOpen]);

  const NavItem = ({ item }: { item: NavigationItem }) => {
    const isActive = pathname === item.href;
    const isDisabled = !isOnline && !item.offline;
    
    return (
      <Link href={item.href} className={cn(isDisabled && 'pointer-events-none')}>
        <div className={cn(
          "flex items-center space-x-3 p-3 rounded-lg transition-colors",
          isActive && "bg-green-100 text-green-700 border border-green-200",
          !isActive && !isDisabled && "hover:bg-gray-50",
          isDisabled && "opacity-50 bg-gray-50"
        )}>
          <item.icon className={cn(
            "w-5 h-5",
            isActive ? "text-green-700" : "text-gray-600"
          )} />
          <span className={cn(
            "font-medium flex-1",
            isActive ? "text-green-700" : "text-gray-900"
          )}>
            {item.label}
          </span>
          {item.badge && (
            <Badge variant="destructive" className="text-xs">
              {item.badge}
            </Badge>
          )}
          {!isOnline && !item.offline && (
            <Badge variant="outline" className="text-xs">
              Offline
            </Badge>
          )}
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </Link>
    );
  };

  // Bottom Navigation for mobile
  if (deviceInfo.isMobile && !isMenuOpen) {
    return (
      <>
        {/* Top Header */}
        <div 
          className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm"
          style={{ paddingTop: safeAreaInsets.top }}
        >
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(true)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold text-green-700">AgriAssist</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              {!isOnline && (
                <Badge variant="outline" className="text-xs">
                  Offline
                </Badge>
              )}
              {isInstallable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={installApp}
                  className="text-xs px-2 py-1"
                >
                  Install
                </Button>
              )}
              <Button variant="ghost" size="icon">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <User className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div 
          className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
          style={{ paddingBottom: safeAreaInsets.bottom }}
        >
          <div className="flex items-center justify-around py-2">
            {navigationItems.slice(0, 5).map((item) => {
              const isActive = pathname === item.href;
              const isDisabled = !isOnline && !item.offline;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center p-2 min-w-0 flex-1 relative",
                    isDisabled && 'pointer-events-none opacity-50'
                  )}
                >
                  <div className="relative">
                    <item.icon className={cn(
                      "w-5 h-5 mb-1",
                      isActive ? "text-green-700" : "text-gray-600"
                    )} />
                    {item.badge && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 text-xs w-4 h-4 p-0 flex items-center justify-center"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs truncate",
                    isActive ? "text-green-700 font-medium" : "text-gray-600"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  // Sidebar Menu Overlay
  return (
    <>
      {/* Backdrop */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 bottom-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 lg:hidden",
        isMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}
      style={{ paddingTop: safeAreaInsets.top }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">AgriAssist</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </nav>

          {/* Additional Menu Items */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="space-y-1">
              <Link href="/settings">
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Settings</span>
                </div>
              </Link>
            </div>
          </div>

          {/* PWA Install Prompt */}
          {isInstallable && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-900 mb-2">Install AgriAssist</h3>
              <p className="text-sm text-green-700 mb-3">
                Get the full app experience with offline capabilities
              </p>
              <Button 
                onClick={installApp}
                className="w-full bg-green-600 hover:bg-green-700"
                size="sm"
              >
                Install App
              </Button>
            </div>
          )}

          {/* Connection Status */}
          <div className="mt-4 p-3 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isOnline ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-sm text-gray-600">
                {isOnline ? "Connected" : "Offline Mode"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}