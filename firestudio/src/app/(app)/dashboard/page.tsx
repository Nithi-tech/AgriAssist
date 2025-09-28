'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sprout, 
  Stethoscope, 
  Cloud, 
  Landmark, 
  TrendingUp,
  TrendingDown,
  Users,
  TestTube,
  Droplets,
  Sun,
  CloudRain,
  Wind,
  Eye,
  Camera,
  MessageCircle,
  ArrowRight,
  Activity,
  Gauge,
  Heart,
  IndianRupee,
  Bot,
  MapPin,
  CalendarDays,
  Thermometer,
  Umbrella,
  BarChart3,
  TrendingDown as TrendingDownIcon,
  Leaf,
  Shield,
  Award,
  Clock,
  Calendar,
  AlertTriangle,
  Timer
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useUnifiedTranslation } from '@/hooks/use-unified-translation';
import { DoubleTapDetector } from '@/components/DoubleTapDetector';
import { VisuallyImpairedMode } from '@/components/VisuallyImpairedMode';
import SensorDashboard from '@/components/SensorDashboard';
import SmartFarmerCalendar from '@/components/SmartFarmerCalendar';
import type { LucideIcon } from 'lucide-react';

export default function Dashboard() {
  const { t } = useUnifiedTranslation();
  const [isVisuallyImpairedMode, setIsVisuallyImpairedMode] = useState(false);
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [isDevelopment, setIsDevelopment] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Check development mode after component mounts to avoid hydration issues
  useEffect(() => {
    const checkDevelopment = process.env.NODE_ENV === 'development' || 
                            (typeof window !== 'undefined' && 
                             (window.location.hostname === 'localhost' || 
                              window.location.hostname === '127.0.0.1' ||
                              window.location.port === '3000'));
    setIsDevelopment(checkDevelopment);
    setIsMounted(true);
    console.log('🏠 Dashboard render - isDevelopment:', checkDevelopment);
  }, []);

  // Helper function to generate weed removal dates (deterministic)
  const generateWeedRemovalDates = () => {
    const dates = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Start from the beginning of current month
    let date = new Date(currentYear, currentMonth, 1);
    
    // Generate dates every 2-3 days (deterministic pattern)
    let dayIncrement = 2;
    while (date.getMonth() === currentMonth) {
      dates.push(new Date(date));
      // Alternate between 2 and 3 days deterministically
      dayIncrement = dayIncrement === 2 ? 3 : 2;
      date.setDate(date.getDate() + dayIncrement);
    }
    
    return dates;
  };

  const weedRemovalDates = generateWeedRemovalDates();
  
  // Find next weed removal date
  const getNextWeedRemovalDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextDate = weedRemovalDates.find(date => {
      const weedDate = new Date(date);
      weedDate.setHours(0, 0, 0, 0);
      return weedDate >= today;
    });
    
    return nextDate || weedRemovalDates[0];
  };

  const nextWeedDate = getNextWeedRemovalDate();
  
  // Calculate days until next weed removal
  const getDaysUntilWeedRemoval = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDate = new Date(nextWeedDate);
    nextDate.setHours(0, 0, 0, 0);
    
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const daysUntilWeed = getDaysUntilWeedRemoval();

  // Handler for activating visually impaired mode
  const handleActivateAccessibilityMode = () => {
    setIsVisuallyImpairedMode(true);
    // Optional: Add vibration feedback if supported
    if ('navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(100);
    }
  };

  // Handler for closing visually impaired mode
  const handleCloseAccessibilityMode = () => {
    setIsVisuallyImpairedMode(false);
  };

  // Enhanced mock data for demonstration
  const weatherData = [
    { day: 'Today', temp: '28°C', icon: Sun, desc: 'Sunny', color: 'text-yellow-500' },
    { day: 'Tue', temp: '26°C', icon: CloudRain, desc: 'Light Rain', color: 'text-blue-500' },
    { day: 'Wed', temp: '24°C', icon: Cloud, desc: 'Cloudy', color: 'text-gray-500' },
    { day: 'Thu', temp: '27°C', icon: Sun, desc: 'Sunny', color: 'text-yellow-500' },
    { day: 'Fri', temp: '25°C', icon: Wind, desc: 'Windy', color: 'text-slate-500' },
  ];

  const marketPrices = [
    { crop: 'Rice', price: '₹2,150', change: '+5.2%', trending: 'up', icon: '🌾' },
    { crop: 'Wheat', price: '₹1,890', change: '-2.1%', trending: 'down', icon: '🌾' },
    { crop: 'Cotton', price: '₹5,670', change: '+8.7%', trending: 'up', icon: '🌿' },
    { crop: 'Sugarcane', price: '₹310', change: '+1.5%', trending: 'up', icon: '🎋' },
  ];

  const quickActions = [
    {
      title: 'Crop Recommendation',
      desc: 'Get AI-powered crop suggestions based on your soil and location',
      icon: Sprout,
      href: '/crop-recommendation',
      color: 'from-primary to-secondary',
      bgColor: 'glass',
      iconColor: 'text-primary'
    },
    {
      title: 'Disease Diagnosis',
      desc: 'Upload plant images for instant disease detection and treatment',
      icon: Stethoscope,
      href: '/disease-diagnosis',
      color: 'from-destructive to-accent',
      bgColor: 'glass',
      iconColor: 'text-destructive'
    },
    {
      title: 'Weather Forecast',
      desc: '7-day detailed weather predictions for better farming decisions',
      icon: Cloud,
      href: '/weather',
      color: 'from-chart-5 to-secondary',
      bgColor: 'glass',
      iconColor: 'text-chart-5'
    },
    {
      title: 'Government Schemes',
      desc: 'Access latest farming subsidies and government support programs',
      icon: Landmark,
      href: '/government-schemes',
      color: 'from-primary to-accent',
      bgColor: 'glass',
      iconColor: 'text-primary'
    },
    {
      title: 'Market Prices',
      desc: 'Real-time crop prices and market trends for better selling decisions',
      icon: IndianRupee,
      href: '/market-prices-new',
      color: 'from-chart-4 to-accent',
      bgColor: 'glass',
      iconColor: 'text-chart-4'
    },
    {
      title: 'Farmer Community',
      desc: 'Connect with fellow farmers, share experiences and get advice',
      icon: Users,
      href: '/community',
      color: 'from-secondary to-accent',
      bgColor: 'glass',
      iconColor: 'text-secondary'
    },
    {
      title: 'AI Assistant',
      desc: 'Chat with our smart farming AI for instant help and guidance',
      icon: Bot,
      href: '/chat',
      color: 'from-accent to-primary',
      bgColor: 'glass',
      iconColor: 'text-accent'
    },
    {
      title: 'All Crops',
      desc: 'View and manage your complete crop database and records',
      icon: Leaf,
      href: '/crops',
      color: 'from-primary to-chart-1',
      bgColor: 'glass',
      iconColor: 'text-primary'
    }
  ];

  return (
    <>
      {/* Visually Impaired Mode Overlay */}
      {isVisuallyImpairedMode && (
        <VisuallyImpairedMode 
          onClose={handleCloseAccessibilityMode} 
          enableKeyboardShortcuts={isDevelopment}
        />
      )}

      {/* Main Dashboard Content wrapped in DoubleTapDetector */}
      <DoubleTapDetector 
        onDoubleTap={handleActivateAccessibilityMode}
        className="space-y-8"
        enabled={!isVisuallyImpairedMode}
      >
        {/* Enhanced Welcome Hero Section - Now at the top */}
        <div className="relative overflow-hidden rounded-3xl glass p-8 md:p-12 text-white shadow-2xl border border-white/20">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent opacity-90"></div>
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-float"></div>
            <div className="absolute bottom-16 right-16 w-16 h-16 bg-accent/20 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 right-1/3 w-12 h-12 bg-white/5 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-4">
                <div className="glass p-4 rounded-2xl shadow-lg border border-white/30 animate-float">
                  <Sun className="h-10 w-10 text-yellow-300" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                    {t('welcome', 'Good Morning!')} 🌅
                  </h1>
                  <p className="text-xl opacity-90 mt-2 font-medium">
                    {t('dashboardDescription', 'Your Smart Farming Hub Awaits')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-white/90">
                <MapPin className="h-5 w-5" />
                <span className="text-lg">Assam, India</span>
                <Badge className="glass text-white border-white/30 hover:bg-white/30">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  Today: August 29
                </Badge>
              </div>
              
              <p className="text-white/90 max-w-xl text-lg leading-relaxed">
                {t('cropRecDesc', 'Optimize your farming with AI-powered recommendations, real-time weather insights, and community-driven knowledge sharing.')}
              </p>
            </div>
            
            <div className="flex flex-col gap-4 lg:items-end">
              {/* Quick Weather Card */}
              <div className="glass rounded-xl p-4 border border-white/20 card-hover">
                <div className="flex items-center gap-3">
                  <Thermometer className="h-5 w-5 text-yellow-300" />
                  <div>
                    <p className="text-sm opacity-80">Current Weather</p>
                    <p className="font-semibold text-lg">28°C · Sunny</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Sensor Dashboard - Now connected to Firebase Realtime Database */}
        <SensorDashboard />

        {/* NEW SMART FARMER CALENDAR - Actionable monthly view for Ranjit Das */}
        {/* 
          HACKATHON FEATURE HIGHLIGHT:
          - Monthly calendar with color-coded irrigation & weeding tasks
          - Interactive task details with best-practice tips
          - Farmer-specific profile integration (Ranjit Das from Assam)
          - 6-month expandable view for seasonal planning
          - Visual priority system (green/yellow/red) for task urgency
          - Modular design for easy backend integration
        */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Compact Calendar - 2/3 width */}
          <div className="lg:col-span-2">
            <SmartFarmerCalendar className="shadow-xl h-fit" />
          </div>
          
          {/* Weed Removal Alert Card - 1/3 width */}
          <div className="space-y-6">
            {/* Weed Removal Alert */}
            <Card className="glass border-2 border-orange-200 shadow-xl bg-gradient-to-br from-orange-50 to-amber-50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-xl shadow-lg animate-pulse">
                    <Sprout className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-orange-800">🌿 Weed Removal Alert</CardTitle>
                    <p className="text-sm text-orange-600 font-medium">Next scheduled activity</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Alert Message */}
                <div className="text-center space-y-3">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-xl shadow-lg">
                    <Timer className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-lg font-bold">Weed Removal Required</p>
                    <p className="text-2xl font-extrabold">{daysUntilWeed} days remaining</p>
                  </div>
                  
                  <div className="text-orange-800 space-y-2">
                    <p className="font-semibold">Next Date:</p>
                    <p className="text-lg font-bold">
                      {nextWeedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                {/* Importance Notice */}
                <div className="bg-white/60 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="text-sm text-orange-800">
                      <p className="font-semibold mb-1">Why it's important:</p>
                      <p className="text-xs leading-relaxed">
                        Regular weed removal prevents competition for nutrients and water, 
                        ensuring optimal crop growth and maximizing your harvest yield.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-orange-800">
                    <span>Time until next weeding</span>
                    <span className="font-semibold">{daysUntilWeed} days</span>
                  </div>
                  <Progress 
                    value={Math.max(0, 100 - (daysUntilWeed * 20))} 
                    className="h-3 bg-orange-100" 
                  />
                  <p className="text-xs text-orange-600 text-center">
                    {daysUntilWeed === 0 ? 'Due today!' : 
                     daysUntilWeed === 1 ? 'Due tomorrow' : 
                     daysUntilWeed <= 3 ? 'Due soon' : 'Scheduled ahead'}
                  </p>
                </div>

                {/* Quick Action Button */}
                <Button 
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg"
                  onClick={() => setShowFullCalendar(true)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  View Full Schedule
                </Button>
              </CardContent>
            </Card>

            {/* Additional Farm Stats */}
            <Card className="glass border-white/20 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-green-600" />
                  Quick Farm Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Crops</span>
                  <Badge className="bg-green-100 text-green-800">5 varieties</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Farm Health</span>
                  <Badge className="bg-blue-100 text-blue-800">Excellent</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Water Status</span>
                  <Badge className="bg-cyan-100 text-cyan-800">Optimal</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Next Harvest</span>
                  <Badge className="bg-orange-100 text-orange-800">3 weeks</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Quick Action Cards Grid */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold gradient-text">Quick Actions</h2>
            <p className="text-gray-600 text-lg">Access your most-used farming tools instantly</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <Link key={action.href} href={action.href}>
                <Card className={`${action.bgColor} border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 card-hover cursor-pointer group relative overflow-hidden h-full`}>
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                  
                  <CardContent className="p-6 relative z-10">
                    <div className="space-y-4">
                      <div className={`w-14 h-14 glass rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 animate-float`} style={{animationDelay: `${index * 0.2}s`}}>
                        <action.icon className={`h-7 w-7 ${action.iconColor}`} />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg text-foreground line-clamp-2">{action.title}</h3>
                        <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">{action.desc}</p>
                      </div>
                      
                      <div className="flex items-center text-muted-foreground group-hover:text-foreground transition-colors">
                        <span className="text-sm font-medium">Learn More</span>
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Enhanced Dashboard Widgets Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Weather Forecast Widget */}
          <Card className="lg:col-span-2 glass border-white/20 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-chart-5 to-secondary p-3 rounded-xl shadow-lg animate-float">
                    <Cloud className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">5-Day Weather Forecast</CardTitle>
                    <CardDescription>Plan your farming activities</CardDescription>
                  </div>
                </div>
                <Link href="/weather">
                  <Button variant="outline" size="sm" className="glass border-white/30 hover:bg-white/20 card-hover">
                    View Details
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-5 gap-4">
                {weatherData.map((day, index) => (
                  <div key={day.day} className="text-center space-y-3 p-3 rounded-xl glass border border-white/20 hover:bg-white/30 transition-colors card-hover">
                    <p className="font-medium text-sm">{day.day}</p>
                    <div className="flex justify-center">
                      <day.icon className={`h-8 w-8 ${day.color}`} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold">{day.temp}</p>
                      <p className="text-xs text-muted-foreground">{day.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between p-4 glass rounded-xl border border-white/20">
                <div className="flex items-center gap-3">
                  <Umbrella className="h-5 w-5 text-chart-5" />
                  <span className="font-medium">Rain Alert</span>
                </div>
                <Badge className="glass border-white/30">
                  Expected Tuesday
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Farm Health Score Widget */}
          <Card className="glass border-white/20 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-xl shadow-lg animate-float">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Farm Health</CardTitle>
                  <CardDescription>Overall status</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold gradient-text">8.7</div>
                <p className="text-muted-foreground font-medium">Excellent Health</p>
                <Progress value={87} className="h-3 bg-muted" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Soil Quality</span>
                  <Badge className="glass border-white/30">Good</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Pest Control</span>
                  <Badge className="glass border-white/30">Active</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Irrigation</span>
                  <Badge className="glass border-white/30">Optimal</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market Prices Widget */}
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="glass border-white/20 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-chart-4 to-accent p-3 rounded-xl shadow-lg animate-float">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Market Prices</CardTitle>
                    <CardDescription>Latest crop rates</CardDescription>
                  </div>
                </div>
                <Link href="/market-prices-new">
                  <Button variant="outline" size="sm" className="glass border-white/30 hover:bg-white/20 card-hover">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {marketPrices.map((item, index) => (
                <div key={item.crop} className="flex items-center justify-between p-3 glass rounded-xl border border-white/20 hover:bg-white/30 transition-colors card-hover">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-semibold">{item.crop}</p>
                      <p className="text-sm text-muted-foreground">per quintal</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{item.price}</p>
                    <div className={`flex items-center gap-1 text-sm ${
                      item.trending === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.trending === 'up' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDownIcon className="h-4 w-4" />
                      )}
                      <span className="font-medium">{item.change}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity Widget */}
          <Card className="glass border-white/20 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-accent to-primary p-3 rounded-xl shadow-lg animate-float">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Recent Activity</CardTitle>
                  <CardDescription>Your farming timeline</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 glass rounded-xl border border-white/20 card-hover">
                  <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-lg">
                    <Sprout className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Crop recommendation received</p>
                    <p className="text-sm text-muted-foreground">For tomatoes in your region</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl border border-violet-200/40">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <Cloud className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-violet-900">Weather alert</p>
                    <p className="text-sm text-violet-700/80">Rain expected in 2 days</p>
                    <p className="text-xs text-violet-600/70 mt-1">5 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl border border-violet-200/40">
                  <div className="bg-red-500 p-2 rounded-lg">
                    <Stethoscope className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-violet-900">Disease diagnosis completed</p>
                    <p className="text-sm text-violet-700/80">Leaf spot detected in tomatoes</p>
                    <p className="text-xs text-violet-600/70 mt-1">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Quick Stats Row */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm opacity-90 font-medium">Total Crops</p>
                  <p className="text-3xl font-bold">12</p>
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="h-4 w-4" />
                    <span>+2 this season</span>
                  </div>
                </div>
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <Sprout className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm opacity-90 font-medium">Field Area</p>
                  <p className="text-3xl font-bold">25 Acres</p>
                  <div className="flex items-center gap-1 text-sm">
                    <Activity className="h-4 w-4" />
                    <span>95% utilized</span>
                  </div>
                </div>
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <Activity className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm opacity-90 font-medium">Yield Rate</p>
                  <p className="text-3xl font-bold">92%</p>
                  <div className="flex items-center gap-1 text-sm">
                    <Award className="h-4 w-4" />
                    <span>Above average</span>
                  </div>
                </div>
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <Gauge className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm opacity-90 font-medium">Health Score</p>
                  <p className="text-3xl font-bold">8.7</p>
                  <div className="flex items-center gap-1 text-sm">
                    <Heart className="h-4 w-4" />
                    <span>Excellent</span>
                  </div>
                </div>
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <Heart className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Full Calendar Modal */}
        {showFullCalendar && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto glass border-white/20 shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Full Weed Removal Calendar</CardTitle>
                      <CardDescription>Complete schedule for the year</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowFullCalendar(false)}
                    className="glass border-white/30 hover:bg-white/20"
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-bold gradient-text">Upcoming Weed Removal Dates</h3>
                  <p className="text-muted-foreground">Schedule optimized for your crop cycle</p>
                </div>
                
                {isMounted ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {weedRemovalDates.slice(0, 12).map((date, index) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const weedDate = new Date(date);
                      weedDate.setHours(0, 0, 0, 0);
                      const isPast = weedDate < today;
                      const isToday = weedDate.getTime() === today.getTime();
                      const isUpcoming = weedDate > today;
                      
                      return (
                        <div 
                          key={index}
                          className={`p-4 rounded-xl border transition-all card-hover ${
                            isPast 
                              ? 'bg-green-50 border-green-200 text-green-800' 
                              : isToday
                              ? 'bg-blue-50 border-blue-200 text-blue-800 ring-2 ring-blue-300'
                              : 'bg-orange-50 border-orange-200 text-orange-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              isPast ? 'bg-green-100' : isToday ? 'bg-blue-100' : 'bg-orange-100'
                            }`}>
                              {isPast ? (
                                <Shield className="h-5 w-5 text-green-600" />
                              ) : isToday ? (
                                <AlertTriangle className="h-5 w-5 text-blue-600" />
                              ) : (
                                <Calendar className="h-5 w-5 text-orange-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold">
                                {date.toLocaleDateString('en-US', { 
                                  weekday: 'short',
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                              <p className="text-sm opacity-80">
                                {isPast ? 'Completed' : isToday ? 'Today' : 'Scheduled'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }, (_, index) => (
                      <div key={index} className="p-4 rounded-xl border bg-muted/20 animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted/40 w-9 h-9"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-muted/40 rounded w-20"></div>
                            <div className="h-3 bg-muted/40 rounded w-16"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="text-center pt-4 border-t border-white/20">
                  <p className="text-sm text-muted-foreground">
                    Regular weed removal helps maintain optimal crop health and yield
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DoubleTapDetector>
    </>
  );
}
