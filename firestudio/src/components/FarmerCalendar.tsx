'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calendar, 
  Sprout, 
  Droplets, 
  Wheat, 
  FlaskConical, 
  Bug,
  AlertTriangle,
  CheckCircle,
  Volume2,
  User,
  TrendingUp,
  MapPin,
  Clock,
  Thermometer,
  CloudRain,
  Sun
} from 'lucide-react';
import { useUnifiedTranslation } from '@/hooks/use-unified-translation';

// Demo data modeling different farmers, crops, and soil types
const FARMER_DATA = [
  {
    farmer_name: "Ranjit Kumar",
    soil_type: "Loamy",
    crop: "Tomato",
    location: "Guwahati, Assam",
    expected_yield: "25 tons/hectare",
    market_price: "₹30/kg",
    calendar: [
      {
        date: "2025-09-01", 
        action: "Sow seeds", 
        tip: "Use nitrogen-rich fertilizer at sowing. Apply 50kg urea per hectare.", 
        risk_level: "green",
        weather_impact: "Ideal temperature 25-30°C",
        disease_risk: "Low - Monitor for early blight"
      },
      {
        date: "2025-09-07", 
        action: "Irrigate", 
        tip: "Irrigate early morning (5-7 AM) to reduce evaporation by 30%", 
        risk_level: "yellow",
        weather_impact: "High evaporation expected",
        disease_risk: "Moderate - Watch for fungal growth"
      },
      {
        date: "2025-09-15", 
        action: "Fertilize", 
        tip: "Apply phosphorus-rich fertilizer. Mix 30kg DAP per hectare.", 
        risk_level: "green",
        weather_impact: "Stable conditions",
        disease_risk: "Low"
      },
      {
        date: "2025-09-25", 
        action: "Pest Control", 
        tip: "Spray neem oil solution in evening. Avoid midday application.", 
        risk_level: "red",
        weather_impact: "High humidity increases pest risk",
        disease_risk: "High - Aphid and whitefly activity"
      },
      {
        date: "2025-10-20", 
        action: "Harvest", 
        tip: "Harvest after 12 days of sunlight for best yield. Check fruit firmness.", 
        risk_level: "green",
        weather_impact: "Perfect harvest conditions",
        disease_risk: "Low"
      }
    ]
  },
  {
    farmer_name: "Maya Devi",
    soil_type: "Sandy",
    crop: "Potato",
    location: "Jorhat, Assam",
    expected_yield: "20 tons/hectare",
    market_price: "₹25/kg",
    calendar: [
      {
        date: "2025-09-05", 
        action: "Sow seeds", 
        tip: "Mix organic compost into sandy soil before sowing. Add 5 tons compost per hectare.", 
        risk_level: "green",
        weather_impact: "Cool weather ideal for potato",
        disease_risk: "Low"
      },
      {
        date: "2025-09-15", 
        action: "Irrigate", 
        tip: "Avoid afternoon irrigation to prevent leaf burn. Sandy soil needs frequent watering.", 
        risk_level: "yellow",
        weather_impact: "High drainage in sandy soil",
        disease_risk: "Moderate - Monitor soil moisture"
      },
      {
        date: "2025-09-28", 
        action: "Fertilize", 
        tip: "Apply potassium-rich fertilizer. Use 40kg MOP per hectare for tuber development.", 
        risk_level: "green",
        weather_impact: "Stable growth period",
        disease_risk: "Low"
      },
      {
        date: "2025-10-10", 
        action: "Pest Control", 
        tip: "Monitor for Colorado potato beetle. Use biological controls first.", 
        risk_level: "red",
        weather_impact: "Warm weather increases pest activity",
        disease_risk: "High - Late blight risk"
      },
      {
        date: "2025-11-01", 
        action: "Harvest", 
        tip: "Harvest when tubers are firm and soil is dry. Test dig a few plants first.", 
        risk_level: "green",
        weather_impact: "Dry conditions perfect for harvest",
        disease_risk: "Low"
      }
    ]
  },
  {
    farmer_name: "Bipul Sharma",
    soil_type: "Clay",
    crop: "Rice",
    location: "Dibrugarh, Assam",
    expected_yield: "35 tons/hectare",
    market_price: "₹22/kg",
    calendar: [
      {
        date: "2025-09-03", 
        action: "Transplant", 
        tip: "Transplant 25-day old seedlings. Maintain 2-3 cm water level.", 
        risk_level: "green",
        weather_impact: "Monsoon conditions ideal",
        disease_risk: "Low - Good drainage in clay soil"
      },
      {
        date: "2025-09-20", 
        action: "Fertilize", 
        tip: "Apply urea top dressing. Use 100kg urea per hectare in standing water.", 
        risk_level: "yellow",
        weather_impact: "Heavy rains may wash nutrients",
        disease_risk: "Moderate - Monitor for bacterial blight"
      },
      {
        date: "2025-10-05", 
        action: "Weed Control", 
        tip: "Manual weeding recommended. Clay soil retains herbicides longer.", 
        risk_level: "yellow",
        weather_impact: "Reduce water level for weeding",
        disease_risk: "Moderate - Disturbed water increases disease risk"
      },
      {
        date: "2025-11-15", 
        action: "Harvest", 
        tip: "Harvest when 80% grains are golden. Drain fields 2 weeks before harvest.", 
        risk_level: "green",
        weather_impact: "Post-monsoon ideal for harvest",
        disease_risk: "Low"
      }
    ]
  }
];

// Action icons mapping
const ACTION_ICONS = {
  "Sow seeds": Sprout,
  "Transplant": Sprout,
  "Irrigate": Droplets,
  "Harvest": Wheat,
  "Fertilize": FlaskConical,
  "Pest Control": Bug,
  "Weed Control": Bug
};

// Risk level colors and styles
const RISK_STYLES = {
  green: {
    bg: "bg-green-50 border-green-200",
    text: "text-green-800",
    badge: "bg-green-100 text-green-800",
    icon: "text-green-600"
  },
  yellow: {
    bg: "bg-yellow-50 border-yellow-200", 
    text: "text-yellow-800",
    badge: "bg-yellow-100 text-yellow-800",
    icon: "text-yellow-600"
  },
  red: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-800", 
    badge: "bg-red-100 text-red-800",
    icon: "text-red-600"
  }
};

interface FarmerCalendarProps {
  className?: string;
  showFullView?: boolean;
}

export function FarmerCalendar({ className = "", showFullView = false }: FarmerCalendarProps) {
  const { t } = useUnifiedTranslation();
  const [selectedFarmer, setSelectedFarmer] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showWeeklySummary, setShowWeeklySummary] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted for proper hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentFarmer = FARMER_DATA[selectedFarmer];

  // Get upcoming events (next 7 days)
  const getUpcomingEvents = () => {
    if (!isMounted) return [];
    
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return currentFarmer.calendar.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate <= nextWeek;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Text-to-speech functionality (demo)
  const speakEvent = (event: any) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const text = `${event.action}: ${event.tip}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!isMounted) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

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
              <p className="text-sm text-muted-foreground">Loading predictive insights...</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-16 bg-muted/20 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const upcomingEvents = getUpcomingEvents();

  return (
    <TooltipProvider>
      <Card className={`glass border-2 ${className}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg animate-float">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl gradient-text">Smart Farmer Calendar</CardTitle>
                <p className="text-sm text-muted-foreground">AI-powered agricultural insights</p>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="glass-hover">
                  View Full Calendar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="gradient-text">Complete Farm Calendar</DialogTitle>
                </DialogHeader>
                <FarmerCalendarFullView />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Farmer Selection */}
          <div className="flex flex-wrap gap-2">
            {FARMER_DATA.map((farmer, index) => (
              <Button
                key={index}
                variant={selectedFarmer === index ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFarmer(index)}
                className={`glass-hover ${selectedFarmer === index ? 'btn-gradient' : ''}`}
              >
                <User className="h-4 w-4 mr-2" />
                {farmer.farmer_name}
              </Button>
            ))}
          </div>

          {/* Weekly Summary Panel */}
          {showWeeklySummary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-enhanced rounded-lg border">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">{currentFarmer.location}</span>
                </div>
                <p className="text-xs text-muted-foreground">{currentFarmer.soil_type} Soil</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-sm">{currentFarmer.expected_yield}</span>
                </div>
                <p className="text-xs text-muted-foreground">Expected Yield</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="font-semibold text-sm text-green-600">{currentFarmer.market_price}</span>
                </div>
                <p className="text-xs text-muted-foreground">Market Price</p>
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                This Week's Actions
              </h3>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {upcomingEvents.length} tasks
              </Badge>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium">All caught up!</p>
                <p className="text-green-600 text-sm">No urgent actions needed this week</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event, index) => {
                  const ActionIcon = ACTION_ICONS[event.action as keyof typeof ACTION_ICONS] || Calendar;
                  const riskStyle = RISK_STYLES[event.risk_level as keyof typeof RISK_STYLES];
                  
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 transition-all card-hover cursor-pointer ${riskStyle.bg}`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-white/60 ${riskStyle.icon}`}>
                          <ActionIcon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-semibold ${riskStyle.text}`}>{event.action}</h4>
                            <Badge className={`text-xs ${riskStyle.badge}`}>
                              {formatDate(event.date)}
                            </Badge>
                          </div>
                          
                          <p className={`text-sm ${riskStyle.text} opacity-90 mb-2`}>
                            {event.tip}
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs">
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center gap-1">
                                  <Thermometer className="h-3 w-3" />
                                  <span>Weather</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{event.weather_impact}</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Risk</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{event.disease_risk}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Tooltip>
                            <TooltipTrigger>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakEvent(event);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Volume2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Listen to instructions</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Crop-specific insights */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Sprout className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-blue-800">
                {currentFarmer.crop} Growth Insights
              </h4>
            </div>
            <p className="text-sm text-blue-700">
              Based on your {currentFarmer.soil_type.toLowerCase()} soil conditions and current weather patterns, 
              your {currentFarmer.crop.toLowerCase()} crop is on track for optimal yield. 
              Continue following the recommended schedule for best results.
            </p>
          </div>
        </CardContent>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {React.createElement(ACTION_ICONS[selectedEvent.action as keyof typeof ACTION_ICONS] || Calendar, { className: "h-5 w-5" })}
                  {selectedEvent.action}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date</label>
                    <p className="font-semibold">{formatDate(selectedEvent.date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Priority</label>
                    <Badge className={RISK_STYLES[selectedEvent.risk_level as keyof typeof RISK_STYLES].badge}>
                      {selectedEvent.risk_level.charAt(0).toUpperCase() + selectedEvent.risk_level.slice(1)} Priority
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Recommended Action</label>
                  <p className="mt-1">{selectedEvent.tip}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Weather Impact</label>
                  <p className="mt-1 flex items-center gap-2">
                    <CloudRain className="h-4 w-4 text-blue-600" />
                    {selectedEvent.weather_impact}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Disease Risk</label>
                  <p className="mt-1 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    {selectedEvent.disease_risk}
                  </p>
                </div>
                
                <Button 
                  onClick={() => speakEvent(selectedEvent)}
                  className="w-full btn-gradient"
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Listen to Instructions
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </Card>
    </TooltipProvider>
  );
}

// Full calendar view component
function FarmerCalendarFullView() {
  const [selectedFarmer, setSelectedFarmer] = useState(0);
  const currentFarmer = FARMER_DATA[selectedFarmer];

  return (
    <div className="space-y-6">
      {/* Farmer Selection */}
      <div className="flex flex-wrap gap-2">
        {FARMER_DATA.map((farmer, index) => (
          <Button
            key={index}
            variant={selectedFarmer === index ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFarmer(index)}
            className={selectedFarmer === index ? 'btn-gradient' : ''}
          >
            <User className="h-4 w-4 mr-2" />
            {farmer.farmer_name}
          </Button>
        ))}
      </div>

      {/* Complete Calendar Grid */}
      <div className="grid gap-4">
        <div className="text-center p-4 bg-gradient-enhanced rounded-lg">
          <h3 className="text-xl font-bold gradient-text mb-2">{currentFarmer.crop} Cultivation Calendar</h3>
          <p className="text-muted-foreground">
            {currentFarmer.farmer_name} • {currentFarmer.location} • {currentFarmer.soil_type} Soil
          </p>
        </div>

        <div className="grid gap-3">
          {currentFarmer.calendar.map((event, index) => {
            const ActionIcon = ACTION_ICONS[event.action as keyof typeof ACTION_ICONS] || Calendar;
            const riskStyle = RISK_STYLES[event.risk_level as keyof typeof RISK_STYLES];
            
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${riskStyle.bg}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-white/60 ${riskStyle.icon}`}>
                    <ActionIcon className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className={`text-lg font-semibold ${riskStyle.text}`}>{event.action}</h4>
                      <Badge className={riskStyle.badge}>
                        {new Date(event.date).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Badge>
                    </div>
                    
                    <p className={`mb-3 ${riskStyle.text} opacity-90`}>
                      {event.tip}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Weather:</span>
                        <span>{event.weather_impact}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">Risk:</span>
                        <span>{event.disease_risk}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FarmerCalendar;
