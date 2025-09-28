'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { WeatherForecastChart } from '@/components/weather-forecast-chart';
import { 
  MapPin, 
  Search, 
  Loader2, 
  AlertTriangle,
  RefreshCw,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Clock,
  Navigation,
  Sun,
  Cloud,
  CalendarDays,
  BarChart3,
  Shield
} from 'lucide-react';

interface HourForecast {
  time: string;
  chance_of_rain: number;
  precip_mm: number;
}

interface WeatherForecastDay {
  date: string;
  maxtemp_c: number;
  mintemp_c: number;
  avgtemp_c: number;
  daily_chance_of_rain: number;
  totalprecip_mm: number;
  maxwind_kph: number;
  condition: {
    text: string;
    icon: string;
  };
  hour?: HourForecast[];
}

interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime: string;
  };
  current: {
    temp_c: number;
    is_day: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_kph: number;
    humidity: number;
    precip_mm: number;
    feelslike_c: number;
    uv: number;
  };
  forecast: WeatherForecastDay[];
  source: string;
  cached: boolean;
  cached_until?: string;
  error?: string;
}

export default function WeatherPage() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  // Clear all states when starting a new fetch
  const clearData = useCallback(() => {
    setWeatherData(null);
    setError(null);
  }, []);

  // Fetch weather by coordinates with cache busting
  const fetchWeatherByCoords = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    clearData();
    
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}&days=7&force=1&_ts=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch weather data');
      }
      
      setWeatherData(data);
      setCity(data.location.name);
    } catch (err: any) {
      console.error('Weather fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clearData]);

  // Fetch weather by city name with cache busting
  const fetchWeatherByCity = useCallback(async (cityName: string) => {
    setLoading(true);
    clearData();
    
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/weather?q=${encodeURIComponent(cityName)}&days=7&force=1&_ts=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch weather data');
      }
      
      setWeatherData(data);
      setCity(data.location.name);
    } catch (err: any) {
      console.error('Weather fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clearData]);

  // Handle manual city search
  const handleSearch = useCallback((cityToSearch?: string) => {
    const searchCity = cityToSearch || searchQuery.trim();
    if (!searchCity) return;
    
    fetchWeatherByCity(searchCity);
    setSearchQuery(''); // Clear the input after search
  }, [searchQuery, fetchWeatherByCity]);

  // Handle GPS location with fresh coordinates
  const handleGetCurrentLocation = useCallback(() => {
    setGpsLoading(true);
    clearData();
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser. Please search for a city manually.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        setGpsLoading(false);
      },
      (gpsError) => {
        console.error('GPS Error:', gpsError);
        let errorMessage = 'Unable to get your location. ';
        
        switch(gpsError.code) {
          case gpsError.PERMISSION_DENIED:
            errorMessage += 'Location access was denied. Please enable location services and try again, or search for a city manually.';
            break;
          case gpsError.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Please search for a city manually.';
            break;
          case gpsError.TIMEOUT:
            errorMessage += 'Location request timed out. Please search for a city manually.';
            break;
          default:
            errorMessage += 'An unknown error occurred. Please search for a city manually.';
            break;
        }
        
        setError(errorMessage);
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // Always get fresh coordinates
      }
    );
  }, [fetchWeatherByCoords, clearData]);

  // Refresh current location data
  const handleRefresh = useCallback(() => {
    if (weatherData?.location) {
      if (weatherData.location.lat && weatherData.location.lon) {
        fetchWeatherByCoords(weatherData.location.lat, weatherData.location.lon);
      } else {
        fetchWeatherByCity(weatherData.location.name);
      }
    } else if (city) {
      fetchWeatherByCity(city);
    }
  }, [weatherData, city, fetchWeatherByCoords, fetchWeatherByCity]);

  // Handle Enter key press in search input
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  }, [handleSearch]);

  // Load default weather on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Fallback to default city if geolocation fails
          fetchWeatherByCity('New Delhi');
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 300000 // Allow 5 minute old location for initial load only
        }
      );
    } else {
      fetchWeatherByCity('New Delhi');
    }
  }, [fetchWeatherByCoords, fetchWeatherByCity]);

  // Format last updated time
  const formatLastUpdated = (localtime: string, cached: boolean, cachedUntil?: string) => {
    const updatedDate = new Date(localtime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60));
    
    if (cached && cachedUntil) {
      const expiryDate = new Date(cachedUntil);
      const expired = now > expiryDate;
      return `${diffMinutes} minutes ago (cached${expired ? ', expired' : ''})`;
    }
    
    return `${diffMinutes} minutes ago`;
  };

  // Chart data preparation
  const chartData = weatherData?.forecast.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    maxTemp: Math.round(day.maxtemp_c),
    minTemp: Math.round(day.mintemp_c),
    precipitation: day.totalprecip_mm,
    chanceOfRain: day.daily_chance_of_rain
  })) || [];

  // Find next predicted rain
  const getNextRainPrediction = () => {
    if (!weatherData?.forecast) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const day of weatherData.forecast) {
      const dayDate = new Date(day.date);
      
      if (dayDate >= today) {
        if (day.daily_chance_of_rain > 30 || day.totalprecip_mm > 0) {
          return {
            date: dayDate.toLocaleDateString('en-GB'),
            time: "Full Day",
            chance: day.daily_chance_of_rain,
            amount: day.totalprecip_mm
          };
        }
      }
    }
    return null;
  };

  const nextRain = getNextRainPrediction();
        {
          // GPS options for fresh location
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // Don't use cached location
        }
      );
    } else {
      setError('Geolocation is not supported by this browser. Please search for a city manually.');
      setGpsLoading(false);
    }
  };

  // Load default weather on component mount
  useEffect(() => {
    // Try to get user's location or default to a major agricultural city
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude, false);
        },
        () => {
          // Fallback to default city if geolocation fails
          fetchWeatherByCity('New Delhi', false); // Major agricultural region
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 300000 // Allow 5 minute old location for initial load
        }
      );
    } else {
      fetchWeatherByCity('New Delhi', false);
    }
  }, []); // Empty dependency array to run only once

  const formatLastUpdated = (localtime: string, cached: boolean, cachedUntil?: string) => {
    const updatedDate = new Date(localtime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60));
    
    if (cached && cachedUntil) {
      const expiryDate = new Date(cachedUntil);
      const expired = now > expiryDate;
      return `${diffMinutes} minutes ago (cached${expired ? ', expired' : ''})`;
    }
    
    return `${diffMinutes} minutes ago`;
  };

  // Chart data preparation
  const chartData = weatherData?.forecast.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    maxTemp: Math.round(day.maxtemp_c),
    minTemp: Math.round(day.mintemp_c),
    precipitation: day.totalprecip_mm,
    chanceOfRain: day.daily_chance_of_rain
  })) || [];

  // Find next predicted rain
  const getNextRainPrediction = () => {
    if (!weatherData?.forecast) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    // Look through each day's forecast
    for (const day of weatherData.forecast) {
      const dayDate = new Date(day.date);
      
      // Only check today and future days
      if (dayDate >= today) {
        // Check if there's a significant chance of rain (>30%) or any precipitation expected
        if (day.daily_chance_of_rain > 30 || day.totalprecip_mm > 0) {
          return {
            date: dayDate.toLocaleDateString('en-GB'), // DD/MM/YYYY format
            time: "Full Day", // Since we only have daily data, not hourly
            chance: day.daily_chance_of_rain,
            amount: day.totalprecip_mm
          };
        }
      }
    }
    return null;
  };

  const nextRain = getNextRainPrediction();

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-8">
      {/* Enhanced Header */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-100 to-cyan-100 px-6 py-3 rounded-full border border-blue-200">
          <Cloud className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold text-blue-800">Weather Forecast</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Plan your farming activities with accurate 7-day weather predictions and agricultural insights
        </p>
      </div>

      {/* Enhanced Search Section */}
      <Card className="bg-gradient-to-br from-sky-50 to-blue-50 border-blue-200 shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-600" />
              <Input
                type="text"
                placeholder="Enter city name (e.g., Mumbai, Delhi, Chennai)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-12 pr-4 h-12 text-lg border-blue-300 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => handleSearch()} 
                disabled={loading || !searchQuery.trim()}
                className="h-12 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Search className="h-5 w-5 mr-2" />}
                Search Weather
              </Button>
              <Button 
                variant="outline" 
                onClick={handleGetCurrentLocation}
                disabled={gpsLoading}
                className="h-12 px-6 border-blue-300 text-blue-700 hover:bg-blue-100 font-semibold"
              >
                {gpsLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Navigation className="h-5 w-5 mr-2" />}
                Use GPS
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rain Prediction Alert */}
      {weatherData && (
        <Alert className={`${nextRain ? "border-blue-500 bg-blue-50" : "border-green-500 bg-green-50"} shadow-lg`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${nextRain ? "bg-blue-100" : "bg-green-100"}`}>
              <Droplets className={`h-5 w-5 ${nextRain ? "text-blue-600" : "text-green-600"}`} />
            </div>
            <AlertDescription className="font-medium text-lg">
              {nextRain ? (
                <div className="flex items-center gap-3">
                  <span>🌧️ Rain expected on {nextRain.date}</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-semibold">
                    {nextRain.chance}% chance · {nextRain.amount.toFixed(1)}mm
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span>☀️ No rain expected in the forecast period</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Clear weather ahead
                  </Badge>
                </div>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="shadow-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {/* Enhanced Loading State */}
      {loading && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-purple-200 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Cloud className="h-10 w-10 text-purple-600 animate-bounce" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-purple-800 mb-2">
                {weatherData ? 'Refreshing Weather Data' : 'Fetching Weather Data'}
              </h3>
              <p className="text-purple-700 text-center">
                {weatherData ? 'Getting the latest weather updates...' : 'Getting the latest weather information for your location...'}
              </p>
              {weatherData && (
                <Badge className="mt-3 bg-purple-200 text-purple-800">
                  Refreshing • Fresh data incoming
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weather Data Display */}
      {weatherData && (
        <div className="space-y-8">
          {/* Weather Alert for Cached/Stale Data */}
          {(weatherData.cached || weatherData.error || (!weatherData.cached && !loading)) && (
            <Alert className={`${
              weatherData.error ? "border-yellow-500 bg-yellow-50" : 
              weatherData.cached ? "border-blue-500 bg-blue-50" : 
              "border-green-500 bg-green-50"
            } shadow-lg`}>
              <div className="flex items-center gap-2">
                {weatherData.error ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : weatherData.cached ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <AlertDescription className="font-medium">
                  {weatherData.error || 
                   (weatherData.cached ? 
                     `Showing cached weather data. ${weatherData.cached_until ? `Cache expires: ${new Date(weatherData.cached_until).toLocaleString()}` : ''}` : 
                     "✅ Fresh weather data loaded successfully!"
                   )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Enhanced Current Weather Card */}
          <Card className="bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-500 text-white border-0 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent"></div>
            <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-4">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                    <MapPin className="h-6 w-6" />
                  </div>
                  {weatherData.location.name}, {weatherData.location.country}
                </CardTitle>
                <CardDescription className="text-blue-100 text-lg">
                  Last updated: {formatLastUpdated(weatherData.location.localtime, weatherData.cached, weatherData.cached_until)}
                  {weatherData.cached ? (
                    <Badge variant="secondary" className="ml-2 bg-yellow-200 text-yellow-800">Cached</Badge>
                  ) : (
                    <Badge variant="secondary" className="ml-2 bg-green-200 text-green-800">Fresh</Badge>
                  )}
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={loading}
                className="border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent className="relative z-10 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Current Temperature */}
                <div className="lg:col-span-2 text-center lg:text-left space-y-4">
                  <div className="flex items-center justify-center lg:justify-start gap-4">
                    {weatherData.current.is_day ? 
                      <Sun className="h-16 w-16 text-yellow-300" /> : 
                      <Cloud className="h-16 w-16 text-gray-300" />
                    }
                    <div>
                      <div className="text-5xl lg:text-6xl font-bold">{Math.round(weatherData.current.temp_c)}°</div>
                      <div className="text-xl opacity-90">
                        Feels like {Math.round(weatherData.current.feelslike_c)}°C
                      </div>
                    </div>
                  </div>
                  <div className="text-xl font-medium">{weatherData.current.condition.text}</div>
                </div>

                {/* Weather Stats */}
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <Droplets className="h-8 w-8 mx-auto mb-2 text-blue-200" />
                    <div className="text-2xl font-bold">{weatherData.current.humidity}%</div>
                    <div className="text-sm opacity-80">Humidity</div>
                  </div>

                  <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <Wind className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                    <div className="text-2xl font-bold">{Math.round(weatherData.current.wind_kph)}</div>
                    <div className="text-sm opacity-80">km/h Wind</div>
                  </div>

                  <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <Eye className="h-8 w-8 mx-auto mb-2 text-orange-200" />
                    <div className="text-2xl font-bold">{weatherData.current.uv}</div>
                    <div className="text-sm opacity-80">UV Index</div>
                  </div>
                </div>
              </div>

              {/* Precipitation Info */}
              <div className="mt-6 flex items-center justify-center lg:justify-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <Droplets className="h-6 w-6 text-blue-200" />
                <span className="text-lg">Precipitation: {weatherData.current.precip_mm} mm</span>
                <Badge variant="secondary" className={`ml-2 ${
                  weatherData.current.uv > 7 ? "bg-red-200 text-red-800" : 
                  weatherData.current.uv > 3 ? "bg-yellow-200 text-yellow-800" : 
                  "bg-green-200 text-green-800"
                }`}>
                  {weatherData.current.uv > 7 ? "High UV" : 
                   weatherData.current.uv > 3 ? "Moderate UV" : "Low UV"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Forecast Chart */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-full">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-green-800 text-xl">7-Day Weather Forecast</CardTitle>
                    <CardDescription className="text-green-700">
                      Temperature and precipitation trends for farming planning
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Agricultural Focus
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-6">
              <WeatherForecastChart data={chartData} />
            </CardContent>
          </Card>

          {/* Enhanced Daily Forecast Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {weatherData.forecast.map((day, index) => {
              const date = new Date(day.date);
              const isToday = index === 0;
              const isTomorrow = index === 1;
              
              return (
                <Card key={day.date} className={`${
                  isToday ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0" :
                  isTomorrow ? "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200" :
                  "bg-white border-gray-200"
                } shadow-lg hover:shadow-xl transition-all duration-300`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className={`text-lg ${isToday ? "text-white" : isTomorrow ? "text-purple-800" : "text-gray-800"}`}>
                          {isToday ? "Today" : 
                           isTomorrow ? "Tomorrow" :
                           date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </CardTitle>
                        <CardDescription className={`${isToday ? "text-blue-100" : isTomorrow ? "text-purple-600" : "text-gray-600"}`}>
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </CardDescription>
                      </div>
                      <div className={`text-right ${isToday ? "text-white" : ""}`}>
                        <div className="text-2xl font-bold">{Math.round(day.maxtemp_c)}°</div>
                        <div className={`text-sm ${isToday ? "text-blue-100" : "text-gray-500"}`}>
                          {Math.round(day.mintemp_c)}°
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={`https:${day.condition.icon}`} 
                        alt={day.condition.text}
                        className="w-12 h-12"
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${isToday ? "text-white" : isTomorrow ? "text-purple-800" : "text-gray-800"}`}>
                          {day.condition.text}
                        </div>
                        <div className={`text-sm ${isToday ? "text-blue-100" : "text-gray-600"}`}>
                          {day.daily_chance_of_rain}% chance of rain
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className={`flex items-center gap-2 ${isToday ? "text-blue-100" : "text-gray-600"}`}>
                        <Droplets className="h-4 w-4" />
                        <span>{day.totalprecip_mm}mm</span>
                      </div>
                      <div className={`flex items-center gap-2 ${isToday ? "text-blue-100" : "text-gray-600"}`}>
                        <Wind className="h-4 w-4" />
                        <span>{Math.round(day.maxwind_kph)} km/h</span>
                      </div>
                    </div>

                    {/* Agricultural Insights */}
                    <div className={`p-3 rounded-lg ${
                      isToday ? "bg-white/20 backdrop-blur-sm" : 
                      isTomorrow ? "bg-purple-100" : "bg-gray-100"
                    }`}>
                      <div className={`text-xs font-medium mb-1 ${isToday ? "text-white" : isTomorrow ? "text-purple-800" : "text-gray-700"}`}>
                        🌱 Farming Insight
                      </div>
                      <div className={`text-xs ${isToday ? "text-blue-100" : isTomorrow ? "text-purple-700" : "text-gray-600"}`}>
                        {day.daily_chance_of_rain > 70 ? "Heavy rain expected - avoid outdoor work" :
                         day.daily_chance_of_rain > 30 ? "Light rain possible - plan accordingly" :
                         day.maxtemp_c > 35 ? "Hot day - ensure adequate irrigation" :
                         day.maxtemp_c < 15 ? "Cool day - protect sensitive crops" :
                         "Good conditions for farming activities"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Agricultural Advisory Section */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-3 rounded-full">
                  <Shield className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-amber-800 text-xl">Agricultural Weather Advisory</CardTitle>
                  <CardDescription className="text-amber-700">
                    Tailored recommendations based on current weather conditions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Irrigation Advisory */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Droplets className="h-6 w-6 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">Irrigation Advisory</h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    {nextRain ? 
                      `Rain expected on ${nextRain.date}. Consider reducing irrigation 1-2 days before.` :
                      `No rain in forecast. Maintain regular irrigation schedule for optimal crop health.`
                    }
                  </p>
                </div>

                {/* Temperature Advisory */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Thermometer className="h-6 w-6 text-red-600" />
                    <h3 className="font-semibold text-red-800">Temperature Advisory</h3>
                  </div>
                  <p className="text-sm text-red-700">
                    {weatherData.current.temp_c > 35 ? 
                      "High temperatures detected. Increase watering frequency and provide shade for sensitive crops." :
                     weatherData.current.temp_c < 15 ?
                      "Cool temperatures present. Consider frost protection for sensitive plants." :
                      "Optimal temperature range for most crops. Maintain regular farming activities."
                    }
                  </p>
                </div>

                {/* Wind Advisory */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Wind className="h-6 w-6 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">Wind Advisory</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    {weatherData.current.wind_kph > 25 ? 
                      "Strong winds present. Avoid spraying pesticides and secure loose materials." :
                     weatherData.current.wind_kph > 15 ?
                      "Moderate winds. Good for natural pollination but be cautious with spraying." :
                      "Calm conditions ideal for spraying and other precision farming activities."
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
