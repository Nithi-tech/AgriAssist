'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Menu, Sprout, Bell, Settings, User, ChevronLeft, ChevronRight, Calendar, Leaf, Shield, AlertTriangle, Timer } from 'lucide-react';
import { MainNav } from '@/components/main-nav';
import { LanguageSelector } from '@/components/language-selector';
import { FarmerProfile } from '@/components/FarmerProfile';
import { useUnifiedTranslation } from '@/hooks/use-unified-translation-safe';
import { cn } from '@/lib/utils';
import { AdminAuthProvider } from '@/providers/admin-auth-provider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [showWeedCalendar, setShowWeedCalendar] = React.useState(false);
  const { t, language } = useUnifiedTranslation();
  
  // Helper function to generate weed removal dates
  const generateWeedRemovalDates = () => {
    const dates = [];
    const today = new Date();
    
    // Generate dates for next 6 months
    for (let month = 0; month < 6; month++) {
      const currentDate = new Date(today.getFullYear(), today.getMonth() + month, 1);
      
      while (currentDate.getMonth() === (today.getMonth() + month) % 12) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + (Math.random() > 0.5 ? 2 : 3));
      }
    }
    
    return dates.filter(date => date >= today);
  };

  const weedRemovalDates = generateWeedRemovalDates();
  
  return (
    <AdminAuthProvider key={`app-layout-${language}`}>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Enhanced Modern Sidebar */}
      <div className={cn(
        "hidden border-r glass md:block transition-all duration-300",
        sidebarCollapsed ? "md:w-16 lg:w-16" : "md:w-[220px] lg:w-[280px]"
      )}>
        <div className="flex h-full max-h-screen flex-col gap-2">
          {/* Logo Section with Gradient */}
          <div className="flex h-14 items-center justify-between border-b border-white/20 px-4 lg:h-[60px] lg:px-6 bg-gradient-to-r from-primary/10 to-secondary/10">
            <Link href="/dashboard" className={cn(
              "flex items-center gap-2 font-bold text-lg transition-all duration-300",
              sidebarCollapsed && "justify-center w-full"
            )}>
              <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-xl shadow-lg animate-float">
                <Sprout className="h-6 w-6 text-white" />
              </div>
              {!sidebarCollapsed && (
                <span className="gradient-text font-bold text-xl">
                  {t('appName', 'AgriAssist')}
                </span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex h-8 w-8 hover:bg-primary/10 rounded-full"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 py-4">
            <MainNav onLinkClick={() => setOpen(false)} collapsed={sidebarCollapsed} />
          </div>
          
          {/* Sidebar Footer */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t border-white/20 bg-gradient-enhanced">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/30 backdrop-blur-sm card-hover">
                <FarmerProfile className="h-10 w-10" />
                <div className="text-sm">
                  <p className="font-semibold text-foreground">Ranjit Das</p>
                  <p className="text-muted-foreground">Online</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col">
        {/* Enhanced Modern Header */}
        <header className="flex h-16 items-center justify-between gap-4 border-b border-white/20 glass px-6 lg:h-[70px] sticky top-0 z-40 shadow-lg">
          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden glass border-primary/20 hover:bg-primary/10">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col glass-dark">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 text-lg font-bold mb-4"
                  onClick={() => setOpen(false)}
                >
                  <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-xl">
                    <Sprout className="h-6 w-6 text-white" />
                  </div>
                  <span className="gradient-text">AgriAssist</span>
                </Link>
                <MainNav onLinkClick={() => setOpen(false)} />
                
                {/* Mobile Language Selector */}
                <div className="mt-4 px-2">
                  <LanguageSelector compact={false} />
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo for mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-xl">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold gradient-text">AgriAssist</span>
          </div>

          {/* Header Right Section */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <LanguageSelector compact={true} className="hidden sm:block" />
            
            {/* Weed Advisory Calendar */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-primary/10 rounded-full card-hover relative"
              title="Weed Advisory Calendar"
              onClick={() => setShowWeedCalendar(true)}
            >
              <Calendar className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full text-xs text-white flex items-center justify-center font-semibold">
                W
              </span>
            </Button>
            
            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 rounded-full card-hover">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-br from-destructive to-accent rounded-full text-xs text-white flex items-center justify-center animate-pulse-glow font-semibold">3</span>
            </Button>
            
            {/* Settings */}
            <Button variant="ghost" size="icon" className="hover:bg-primary/10 rounded-full card-hover">
              <Settings className="h-5 w-5" />
            </Button>
            
            {/* User Profile */}
            <FarmerProfile className="h-10 w-10" />
          </div>
        </header>
        {/* Enhanced Main Content Area */}
        <main className="flex flex-1 flex-col gap-6 p-6 lg:gap-8 lg:p-8 bg-gradient-enhanced min-h-screen custom-scrollbar">
          <div className="relative">
            {children}
          </div>
        </main>
      </div>
      
      {/* Weed Advisory Calendar Modal */}
      {showWeedCalendar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto glass border-white/20 shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg">
                    <Leaf className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Weed Advisory Calendar</CardTitle>
                    <CardDescription>Complete weed removal schedule</CardDescription>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowWeedCalendar(false)}
                  className="glass border-white/30 hover:bg-white/20"
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Complete Weed Removal Schedule
                </h3>
                <p className="text-muted-foreground">
                  Optimized schedule for maximum crop protection and yield
                </p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {weedRemovalDates.slice(0, 18).map((date, index) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const weedDate = new Date(date);
                  weedDate.setHours(0, 0, 0, 0);
                  const isPast = weedDate < today;
                  const isToday = weedDate.getTime() === today.getTime();
                  const isUpcoming = weedDate > today;
                  const daysFromToday = Math.ceil((weedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div 
                      key={index}
                      className={`p-4 rounded-xl border transition-all hover:scale-105 cursor-pointer ${
                        isPast 
                          ? 'bg-green-50 border-green-200 text-green-800' 
                          : isToday
                          ? 'bg-blue-50 border-blue-200 text-blue-800 ring-2 ring-blue-300 animate-pulse'
                          : daysFromToday <= 3
                          ? 'bg-red-50 border-red-200 text-red-800 ring-1 ring-red-300'
                          : 'bg-orange-50 border-orange-200 text-orange-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isPast 
                            ? 'bg-green-100' 
                            : isToday 
                            ? 'bg-blue-100' 
                            : daysFromToday <= 3
                            ? 'bg-red-100'
                            : 'bg-orange-100'
                        }`}>
                          {isPast ? (
                            <Shield className="h-5 w-5 text-green-600" />
                          ) : isToday ? (
                            <AlertTriangle className="h-5 w-5 text-blue-600" />
                          ) : daysFromToday <= 3 ? (
                            <Timer className="h-5 w-5 text-red-600" />
                          ) : (
                            <Calendar className="h-5 w-5 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {date.toLocaleDateString('en-US', { 
                              weekday: 'short',
                              month: 'short', 
                              day: 'numeric',
                              year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                            })}
                          </p>
                          <p className="text-sm opacity-80">
                            {isPast 
                              ? 'Completed' 
                              : isToday 
                              ? 'Today!' 
                              : daysFromToday <= 3
                              ? `${daysFromToday} day${daysFromToday === 1 ? '' : 's'} left`
                              : 'Scheduled'
                            }
                          </p>
                        </div>
                      </div>
                      
                      {!isPast && (
                        <div className="mt-3 pt-3 border-t border-current/20">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              isToday 
                                ? 'bg-blue-500 animate-pulse' 
                                : daysFromToday <= 3
                                ? 'bg-red-500'
                                : 'bg-orange-500'
                            }`}></div>
                            <span className="text-xs font-medium">
                              {isToday 
                                ? 'Action Required' 
                                : daysFromToday <= 3
                                ? 'Prepare Soon'
                                : 'Future Task'
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="flex items-center justify-center gap-8 pt-6 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Urgent (≤3 days)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Upcoming</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Completed</span>
                </div>
              </div>
              
              <div className="text-center pt-4">
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                  <Leaf className="h-3 w-3 mr-1" />
                  Regular weeding improves yield by 15-25%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </AdminAuthProvider>
  );
}
