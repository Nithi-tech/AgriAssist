'use client';

import { useState, useEffect } from 'react';
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
          fetchWeatherByCity('New Delhi', false); // Major agricultural region - call directly
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 300000 // Allow 5 minute old location for initial load
        }
      );
    } else {
      fetchWeatherByCity('New Delhi', false); // Call directly instead of handleSearch
    }
  }, []);

  const fetchWeatherByCoords = async (lat: number, lon: number, forceRefresh = false) => {
    setLoading(true);
    setError(null);
    // Clear old data immediately
    setWeatherData(null);
    
    try {
      const forceParam = forceRefresh ? '&force=1' : '';
      const timestamp = new Date().getTime(); // Cache busting
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}&days=7${forceParam}&_t=${timestamp}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch weather data');
      }
      
      setWeatherData(data);
      setCity(data.location.name);
    } catch (err: any) {
      setError(err.message);
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCity = async (cityName: string, forceRefresh = false) => {
    setLoading(true);
    setError(null);
    // Clear old data immediately
    setWeatherData(null);
    
    try {
      const forceParam = forceRefresh ? '&force=1' : '';
      const timestamp = new Date().getTime(); // Cache busting
      const response = await fetch(`/api/weather?q=${encodeURIComponent(cityName)}&days=7${forceParam}&_t=${timestamp}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch weather data');
      }
      
      setWeatherData(data);
      setCity(data.location.name);
    } catch (err: any) {
      setError(err.message);
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchCity?: string) => {
    const cityToSearch = searchCity || searchQuery.trim();
    if (!cityToSearch) return;
    
    // Always force refresh for manual searches to get latest data
    fetchWeatherByCity(cityToSearch, true);
    // Keep the searchQuery so users can easily modify their search
    // No need to clear the input field
  };

  const handleRefresh = () => {
    if (weatherData?.location) {
      // Force refresh using the same location data
      if (weatherData.location.lat && weatherData.location.lon) {
        fetchWeatherByCoords(weatherData.location.lat, weatherData.location.lon, true);
      } else {
        fetchWeatherByCity(weatherData.location.name, true);
      }
    } else if (city) {
      // Fallback to city name if we have it
      fetchWeatherByCity(city, true);
    }
  };

  const handleGetCurrentLocation = () => {
    setGpsLoading(true);
    setError(null);
    // Clear old data immediately when getting new GPS location
    setWeatherData(null);
    
    if (navigator.geolocation) {
      // Clear any cached geolocation and get fresh coordinates
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Always force refresh for GPS requests to get latest data
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude, true);
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
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    handleSearch();
                  }
                }}
                disabled={false}
                readOnly={false}
                className="pl-12 pr-4 h-12 text-lg border-blue-300 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => handleSearch()} 
                disabled={loading || !searchQuery.trim()}
                className="h-12 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Search className="h-5 w-5 mr-2" />}
                Search Weather
              </Button>
              <Button 
                variant="outline" 
                onClick={handleGetCurrentLocation}
                disabled={gpsLoading || loading}
                className="h-12 px-6 border-blue-300 text-blue-700 hover:bg-blue-100 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                  UV: {weatherData.current.uv > 7 ? "High" : weatherData.current.uv > 3 ? "Moderate" : "Low"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 7-Day Forecast Chart */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl text-indigo-800">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-indigo-600" />
                </div>
                7-Day Temperature & Precipitation Forecast
              </CardTitle>
              <CardDescription className="text-indigo-700/80">Daily highs, lows, and rainfall predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-indigo-200">
                <WeatherForecastChart data={chartData} />
              </div>
            </CardContent>
          </Card>

          {/* Detailed Daily Forecast */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl text-green-800">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CalendarDays className="h-6 w-6 text-green-600" />
                </div>
                Detailed 7-Day Forecast
              </CardTitle>
              <CardDescription className="text-green-700/80">Complete weather breakdown for farming planning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {weatherData.forecast.map((day, index) => (
                  <div key={day.date} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-green-200 hover:bg-white/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="text-center min-w-[80px]">
                          <div className="text-lg font-bold text-green-800">
                            {index === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="text-sm text-green-600">
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <img 
                            src={`https:${day.condition.icon}`} 
                            alt={day.condition.text}
                            className="w-12 h-12"
                          />
                          <div>
                            <div className="font-semibold text-green-800">{day.condition.text}</div>
                            <div className="text-sm text-green-600 flex items-center gap-4">
                              <span>💧 Rain: {day.daily_chance_of_rain}%</span>
                              <span>💨 Wind: {Math.round(day.maxwind_kph)} km/h</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right space-y-2">
                        <div className="text-2xl font-bold text-green-800">
                          {Math.round(day.maxtemp_c)}° / {Math.round(day.mintemp_c)}°
                        </div>
                        {day.totalprecip_mm > 0 && (
                          <Badge className="bg-blue-100 text-blue-800">
                            {day.totalprecip_mm}mm rain
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Farming Insights */}
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl text-yellow-800">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Sun className="h-6 w-6 text-yellow-600" />
                </div>
                Farming Insights
              </CardTitle>
              <CardDescription className="text-yellow-700/80">Weather-based recommendations for your farm</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-yellow-200">
                  <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                    <Droplets className="h-5 w-5" />
                    Irrigation Advice
                  </h3>
                  {nextRain ? (
                    <p className="text-yellow-700">
                      💧 Rain expected in {nextRain.date}. Consider reducing irrigation 1-2 days before to avoid waterlogging.
                    </p>
                  ) : (
                    <p className="text-yellow-700">
                      ☀️ No rain expected. Maintain regular irrigation schedule and monitor soil moisture levels.
                    </p>
                  )}
                </div>
                
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-yellow-200">
                  <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Crop Protection
                  </h3>
                  <p className="text-yellow-700">
                    {weatherData.current.uv > 7 ? 
                      "🌡️ High UV levels. Protect sensitive crops and ensure adequate water supply." :
                      "✅ Moderate UV levels. Good conditions for most field activities."
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Source */}
          <div className="text-center">
            <Badge variant="secondary" className="bg-gray-100 text-gray-700 px-4 py-2">
              📡 Weather data provided by {weatherData.source}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
