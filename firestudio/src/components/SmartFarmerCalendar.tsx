'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calendar, 
  Droplets, 
  Sprout,
  ChevronLeft,
  ChevronRight,
  Info,
  MapPin,
  Phone,
  User,
  Wheat
} from 'lucide-react';
import { useUnifiedTranslation } from '@/hooks/use-unified-translation';

/**
 * HACKATHON FEATURE: Smart Farmer Calendar for Ranjit Das
 * 
 * This component showcases:
 * 1. Monthly calendar view with actionable farming events (weeding & irrigation)
 * 2. Color-coded visual system for task priorities and status
 * 3. Interactive tooltips with crop-specific best practices
 * 4. 6-month expandable modal for long-term planning
 * 5. Farmer-centric UI design optimized for rural users
 * 
 * Technical Highlights:
 * - Modular, self-contained component for easy integration/removal
 * - Responsive design that works on mobile devices
 * - Seasonal intelligence for realistic task scheduling
 * - Visual accessibility with icons, colors, and clear typography
 */

// Farmer Profile - Demo Data for Ranjit Das
const FARMER_PROFILE = {
  FarmerID: "FMR-GHY-1024",
  Name: "Ranjit Das",
  Age: 42,
  Location: "Chandrapur Village, near Guwahati, Assam",
  Phone: "+91 94351 67892",
  LandSize: "3.5 acres",
  PrimaryCrops: ["Rice (Sali variety)", "Mustard", "Brinjal", "Tomato", "Chili"],
  FarmingType: "Traditional + Semi-modern (uses irrigation pump & soil testing occasionally)",
  IrrigationSource: "Borewell + Rainwater harvesting"
};

/**
 * Calendar Task Data Structure - Designed for easy backend integration
 * 
 * Each task represents an actionable farming event with:
 * - date: ISO date string for precise scheduling
 * - action: Type of farming activity (Irrigation/Weeding)
 * - crop: Specific crop requiring attention
 * - tip: Agronomic best practice advice
 * - risk_level: Visual priority indicator (green/yellow/red)
 * 
 * This structure can easily be replaced with API calls to real farming data
 */
const CALENDAR_TASKS = [
  // September 2025 - Post-monsoon activities
  {
    date: "2025-09-01",
    action: "Irrigation",
    crop: "Rice",
    tip: "Irrigate early morning (5-7 AM), adjust based on rainfall forecast. Maintain 2-3 cm water level.",
    risk_level: "green"
  },
  {
    date: "2025-09-03",
    action: "Weeding",
    crop: "Rice",
    tip: "First weeding at 20-25 days after transplanting. Remove weeds manually to avoid root damage.",
    risk_level: "yellow"
  },
  {
    date: "2025-09-07",
    action: "Weeding",
    crop: "Brinjal",
    tip: "Hand weeding recommended 2 weeks after transplant. Avoid disturbing young roots.",
    risk_level: "yellow"
  },
  {
    date: "2025-09-10",
    action: "Irrigation",
    crop: "Tomato",
    tip: "Deep watering twice weekly. Check soil moisture 2 inches deep before irrigating.",
    risk_level: "green"
  },
  {
    date: "2025-09-14",
    action: "Irrigation",
    crop: "Chili",
    tip: "Apply light irrigation if soil dryness exceeds threshold. Avoid waterlogging.",
    risk_level: "yellow"
  },
  {
    date: "2025-09-17",
    action: "Weeding",
    crop: "Tomato",
    tip: "Remove weeds around base. Mulching helps retain moisture and suppress weeds.",
    risk_level: "green"
  },
  {
    date: "2025-09-20",
    action: "Weeding",
    crop: "Mustard",
    tip: "Remove weeds at 3–4 leaf stage for best yield. Use hand hoe for precise weeding.",
    risk_level: "green"
  },
  {
    date: "2025-09-24",
    action: "Irrigation",
    crop: "Rice",
    tip: "Maintain consistent water level during flowering stage. Critical for grain formation.",
    risk_level: "red"
  },
  {
    date: "2025-09-28",
    action: "Weeding",
    crop: "Chili",
    tip: "Second weeding before flowering. Remove competing vegetation for better fruit set.",
    risk_level: "yellow"
  },

  // October 2025 - Pre-winter preparations
  {
    date: "2025-10-02",
    action: "Irrigation",
    crop: "Brinjal",
    tip: "Increase irrigation frequency as temperature drops. Morning irrigation preferred.",
    risk_level: "green"
  },
  {
    date: "2025-10-08",
    action: "Weeding",
    crop: "Rice",
    tip: "Final weeding before harvest. Focus on areas with heavy weed pressure.",
    risk_level: "yellow"
  },
  {
    date: "2025-10-12",
    action: "Irrigation",
    crop: "Mustard",
    tip: "First irrigation 3-4 weeks after sowing. Light irrigation to encourage germination.",
    risk_level: "green"
  },
  {
    date: "2025-10-18",
    action: "Weeding",
    crop: "Brinjal",
    tip: "Keep area weed-free during fruit development. Hand weeding around plants.",
    risk_level: "green"
  },
  {
    date: "2025-10-25",
    action: "Irrigation",
    crop: "Tomato",
    tip: "Reduce irrigation frequency as weather cools. Monitor plant stress indicators.",
    risk_level: "yellow"
  },

  // November 2025 - Harvest and winter prep
  {
    date: "2025-11-05",
    action: "Irrigation",
    crop: "Chili",
    tip: "Careful irrigation during fruit maturation. Avoid water stress during pod filling.",
    risk_level: "red"
  },
  {
    date: "2025-11-12",
    action: "Weeding",
    crop: "Mustard",
    tip: "Weeding at rosette stage. Critical for good canopy development.",
    risk_level: "yellow"
  },
  {
    date: "2025-11-20",
    action: "Irrigation",
    crop: "Mustard",
    tip: "Pre-flowering irrigation. Ensure adequate moisture for flower initiation.",
    risk_level: "green"
  },
  {
    date: "2025-11-28",
    action: "Weeding",
    crop: "Tomato",
    tip: "Final weeding before harvest season. Clear harvest paths.",
    risk_level: "green"
  },

  // December 2025 - Winter management
  {
    date: "2025-12-03",
    action: "Irrigation",
    crop: "Brinjal",
    tip: "Winter irrigation schedule. Water during warmer part of day.",
    risk_level: "yellow"
  },
  {
    date: "2025-12-10",
    action: "Weeding",
    crop: "Chili",
    tip: "Winter weeding around mature plants. Prepare for harvest.",
    risk_level: "green"
  },
  {
    date: "2025-12-18",
    action: "Irrigation",
    crop: "Mustard",
    tip: "Flowering stage irrigation. Critical for pod formation.",
    risk_level: "red"
  },
  {
    date: "2025-12-25",
    action: "Weeding",
    crop: "Mustard",
    tip: "Pre-harvest field preparation. Clear weeds for easy harvesting.",
    risk_level: "yellow"
  },

  // January 2026 - New year activities
  {
    date: "2026-01-08",
    action: "Irrigation",
    crop: "Tomato",
    tip: "Winter irrigation management. Adjust timing based on frost risk.",
    risk_level: "yellow"
  },
  {
    date: "2026-01-15",
    action: "Weeding",
    crop: "Brinjal",
    tip: "Winter season weeding. Prepare beds for next crop cycle.",
    risk_level: "green"
  },
  {
    date: "2026-01-22",
    action: "Irrigation",
    crop: "Chili",
    tip: "Harvest season irrigation. Maintain quality during extended harvest.",
    risk_level: "green"
  },

  // February 2026 - Spring preparation
  {
    date: "2026-02-05",
    action: "Weeding",
    crop: "Mustard",
    tip: "Post-harvest field clearing. Prepare for summer crop planning.",
    risk_level: "yellow"
  },
  {
    date: "2026-02-12",
    action: "Irrigation",
    crop: "Brinjal",
    tip: "Pre-summer irrigation planning. Assess water source availability.",
    risk_level: "green"
  },
  {
    date: "2026-02-20",
    action: "Weeding",
    crop: "Tomato",
    tip: "Field preparation for next planting season. Soil preparation begins.",
    risk_level: "green"
  }
];

/**
 * Visual System for Task Priority and Status
 * 
 * Color-coded system designed for quick visual recognition:
 * - Green: Normal priority, routine maintenance
 * - Yellow: Attention needed, moderate importance
 * - Red: High priority, critical timing
 * 
 * Each level includes distinct styling for accessibility
 */
const RISK_STYLES = {
  green: {
    bg: "bg-green-50 border-green-200 hover:bg-green-100",
    text: "text-green-800",
    badge: "bg-green-500 text-white",
    icon: "text-green-600",
    dot: "bg-green-500"
  },
  yellow: {
    bg: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100", 
    text: "text-yellow-800",
    badge: "bg-yellow-500 text-white",
    icon: "text-yellow-600",
    dot: "bg-yellow-500"
  },
  red: {
    bg: "bg-red-50 border-red-200 hover:bg-red-100",
    text: "text-red-800", 
    badge: "bg-red-500 text-white",
    icon: "text-red-600",
    dot: "bg-red-500"
  }
};

/**
 * Action Icon Mapping for Visual Clarity
 * 
 * Uses intuitive icons for immediate task recognition:
 * - Droplets (💧): Irrigation tasks
 * - Sprout (🌿): Weeding and plant care
 */
const ACTION_ICONS = {
  "Irrigation": Droplets,
  "Weeding": Sprout
};

interface SmartFarmerCalendarProps {
  className?: string;
}

/**
 * Main Smart Farmer Calendar Component
 * 
 * Features:
 * 1. Monthly grid view with task visualization
 * 2. Interactive task details on hover/click
 * 3. Farmer profile integration
 * 4. Expandable 6-month modal view
 * 5. Responsive design for all devices
 */
export function SmartFarmerCalendar({ className = "" }: SmartFarmerCalendarProps) {
  const { t } = useUnifiedTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure proper hydration for SSR compatibility
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Task Filtering Logic
   * 
   * Efficiently filters tasks by date for calendar display
   * Designed for easy extension to support date ranges
   */
  const getTasksForDate = (date: Date) => {
    if (!isMounted) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    return CALENDAR_TASKS.filter(task => task.date === dateStr);
  };

  /**
   * Calendar Grid Generation
   * 
   * Creates a standard monthly calendar layout
   * Includes proper week structure and month boundaries
   */
  const generateCalendarDays = () => {
    if (!isMounted) return [];
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and calculate grid start
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    // Generate 42 days (6 weeks) for complete calendar grid
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  /**
   * Date Navigation Functions
   * 
   * Simple month-based navigation for calendar browsing
   */
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  /**
   * Date Formatting Utilities
   * 
   * Consistent date formatting across the component
   */
  const formatMonthYear = (date: Date) => {
    if (!isMounted) return '';
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isToday = (date: Date) => {
    if (!isMounted) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Loading state for SSR compatibility
  if (!isMounted) {
    return (
      <Card className={`glass border-2 ${className}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-3 rounded-xl shadow-lg animate-pulse">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl gradient-text">Smart Farmer Calendar</CardTitle>
              <p className="text-sm text-muted-foreground">Loading calendar...</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted/20 rounded"></div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }, (_, i) => (
                <div key={i} className="h-12 bg-muted/20 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const calendarDays = generateCalendarDays();

  return (
    <Card className={`glass border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {/* Header with Farmer Info */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-2.5 rounded-xl shadow-lg animate-float">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg gradient-text">🌾 Smart Farm Calendar</CardTitle>
              <div className="flex items-center gap-2 text-xs text-green-700">
                <User className="h-3 w-3" />
                <span className="font-medium">{FARMER_PROFILE.Name}</span>
                <span>•</span>
                <MapPin className="h-3 w-3" />
                <span>{FARMER_PROFILE.LandSize}</span>
              </div>
            </div>
          </div>

          {/* Expand to Full Calendar Button */}
          <Dialog open={showFullCalendar} onOpenChange={setShowFullCalendar}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="glass-hover border-green-200 hover:bg-green-100 text-green-700">
                <Calendar className="h-3 w-3 mr-1" />
                <span className="text-xs">6 Months</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="gradient-text">6-Month Farming Calendar - {FARMER_PROFILE.Name}</DialogTitle>
              </DialogHeader>
              <SixMonthCalendarView />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="glass-hover border-green-200 hover:bg-green-100 text-green-700 h-8 w-8 p-0"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          
          <h3 className="text-base font-bold text-green-800">{formatMonthYear(currentDate)}</h3>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="glass-hover border-green-200 hover:bg-green-100 text-green-700 h-8 w-8 p-0"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-1">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-xs font-bold text-green-700 p-1.5 bg-green-100 rounded">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const tasks = getTasksForDate(day);
              const hasIrrigation = tasks.some(t => t.action === 'Irrigation');
              const hasWeeding = tasks.some(t => t.action === 'Weeding');
              const highPriorityTask = tasks.find(t => t.risk_level === 'red');
              const isCurrentMonthDay = isCurrentMonth(day);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={index}
                  className={`
                    relative aspect-square flex flex-col items-center justify-center text-xs rounded-lg transition-all cursor-pointer border-2
                    ${!isCurrentMonthDay ? 'text-muted-foreground/40 border-transparent' : 'hover:bg-green-100 border-transparent hover:border-green-300'}
                    ${isTodayDate ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold shadow-lg ring-2 ring-blue-300 border-blue-400' : ''}
                    ${tasks.length > 0 && !isTodayDate ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-300 shadow-sm' : ''}
                    ${highPriorityTask && !isTodayDate ? 'bg-gradient-to-br from-red-100 to-orange-100 border-red-300 shadow-md ring-1 ring-red-200' : ''}
                  `}
                  onClick={() => tasks.length > 0 && setSelectedTask({ date: day, tasks })}
                >
                  {/* Date Number */}
                  <span className={`${tasks.length > 0 ? 'font-bold' : 'font-medium'} ${highPriorityTask && !isTodayDate ? 'text-red-700' : ''}`}>
                    {day.getDate()}
                  </span>

                  {/* Task Indicators */}
                  {tasks.length > 0 && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {hasIrrigation && (
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          highPriorityTask ? 'bg-red-600 shadow-sm' : 
                          isTodayDate ? 'bg-white' : 'bg-blue-600'
                        }`} />
                      )}
                      {hasWeeding && (
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          highPriorityTask ? 'bg-red-600 shadow-sm' : 
                          isTodayDate ? 'bg-white' : 'bg-green-600'
                        }`} />
                      )}
                    </div>
                  )}

                  {/* High Priority Indicator */}
                  {highPriorityTask && !isTodayDate && (
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Enhanced Legend */}
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Droplets className="h-3 w-3 text-blue-600" />
              <span className="font-medium text-blue-700">💧 Irrigation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sprout className="h-3 w-3 text-green-600" />
              <span className="font-medium text-green-700">🌿 Weeding</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="font-medium text-red-700">🚨 Urgent</span>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Task Detail Modal */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {selectedTask.date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedTask.tasks.map((task: any, index: number) => {
                const ActionIcon = ACTION_ICONS[task.action as keyof typeof ACTION_ICONS];
                const riskStyle = RISK_STYLES[task.risk_level as keyof typeof RISK_STYLES];
                
                return (
                  <div key={index} className={`p-4 rounded-lg border-2 ${riskStyle.bg}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-white/60 ${riskStyle.icon}`}>
                        <ActionIcon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className={`font-semibold ${riskStyle.text}`}>{task.action}</h4>
                          <Badge className={riskStyle.badge}>
                            {task.crop}
                          </Badge>
                        </div>
                        
                        <p className={`text-sm ${riskStyle.text} opacity-90`}>
                          {task.tip}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

/**
 * Six-Month Calendar View Component
 * 
 * Expanded view for long-term planning and seasonal overview
 * Shows all scheduled tasks across multiple months
 */
function SixMonthCalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const generateSixMonths = () => {
    const months = [];
    const current = new Date(currentMonth);
    
    for (let i = 0; i < 6; i++) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  };

  const getTasksForMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    return CALENDAR_TASKS.filter(task => {
      const taskDate = new Date(task.date);
      return taskDate.getFullYear() === year && taskDate.getMonth() === month;
    });
  };

  const months = generateSixMonths();

  return (
    <div className="space-y-6">
      {/* Farmer Profile Header */}
      <div className="bg-gradient-enhanced p-4 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Farmer:</strong> {FARMER_PROFILE.Name}<br />
            <strong>Location:</strong> {FARMER_PROFILE.Location}
          </div>
          <div>
            <strong>Land Size:</strong> {FARMER_PROFILE.LandSize}<br />
            <strong>Phone:</strong> {FARMER_PROFILE.Phone}
          </div>
          <div>
            <strong>Primary Crops:</strong><br />
            {FARMER_PROFILE.PrimaryCrops.slice(0, 3).join(', ')}
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const newDate = new Date(currentMonth);
            newDate.setMonth(newDate.getMonth() - 1);
            setCurrentMonth(newDate);
          }}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous 6 Months
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {
            const newDate = new Date(currentMonth);
            newDate.setMonth(newDate.getMonth() + 1);
            setCurrentMonth(newDate);
          }}
        >
          Next 6 Months
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Monthly Task Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {months.map((month, index) => {
          const monthTasks = getTasksForMonth(month);
          const irrigationTasks = monthTasks.filter(t => t.action === 'Irrigation');
          const weedingTasks = monthTasks.filter(t => t.action === 'Weeding');
          const highPriorityTasks = monthTasks.filter(t => t.risk_level === 'red');

          return (
            <Card key={index} className="glass border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Task Count Summary */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-600" />
                    <span>{irrigationTasks.length} Irrigation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sprout className="h-4 w-4 text-green-600" />
                    <span>{weedingTasks.length} Weeding</span>
                  </div>
                </div>

                {/* High Priority Tasks */}
                {highPriorityTasks.length > 0 && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-center gap-2 text-red-800 text-xs font-medium mb-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      High Priority ({highPriorityTasks.length})
                    </div>
                    {highPriorityTasks.slice(0, 2).map((task, idx) => (
                      <div key={idx} className="text-xs text-red-700">
                        {new Date(task.date).getDate()}: {task.action} - {task.crop}
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent Tasks Preview */}
                <div className="space-y-1">
                  {monthTasks.slice(0, 3).map((task, idx) => {
                    const ActionIcon = ACTION_ICONS[task.action as keyof typeof ACTION_ICONS];
                    const riskStyle = RISK_STYLES[task.risk_level as keyof typeof RISK_STYLES];
                    
                    return (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <ActionIcon className={`h-3 w-3 ${riskStyle.icon}`} />
                        <span>{new Date(task.date).getDate()}</span>
                        <span className="truncate">{task.crop}</span>
                      </div>
                    );
                  })}
                  {monthTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{monthTasks.length - 3} more tasks
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default SmartFarmerCalendar;
