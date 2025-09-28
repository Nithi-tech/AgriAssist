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
  Cloud
} from 'lucide-react';

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
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Fallback to default city if geolocation fails
          handleSearch('New Delhi'); // Major agricultural region
        }
      );
    } else {
      handleSearch('New Delhi');
    }
  }, []);

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}&days=7`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch weather data');
      }
      
      setWeatherData(data);
      setCity(data.location.name);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCity = async (cityName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/weather?q=${encodeURIComponent(cityName)}&days=7`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch weather data');
      }
      
      setWeatherData(data);
      setCity(data.location.name);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchCity?: string) => {
    const cityToSearch = searchCity || searchQuery.trim();
    if (!cityToSearch) return;
    
    fetchWeatherByCity(cityToSearch);
    setSearchQuery('');
  };

  const handleRefresh = () => {
    if (weatherData) {
      // Force refresh by adding force=1 parameter
      setLoading(true);
      setError(null);
      
      const refreshUrl = weatherData.location 
        ? `/api/weather?lat=${weatherData.location.lat}&lon=${weatherData.location.lon}&days=7&force=1`
        : `/api/weather?q=${encodeURIComponent(city)}&days=7&force=1`;
        
      fetch(refreshUrl)
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            throw new Error(data.error);
          }
          setWeatherData(data);
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  };

  const handleGetCurrentLocation = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
          setGpsLoading(false);
        },
        (error) => {
          setError('Unable to get your location. Please search for a city manually.');
          setGpsLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
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

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">7-Day Weather Forecast</h1>
        <p className="text-muted-foreground">
          Plan your farming activities with accurate weather predictions
        </p>
      </div>

      {/* Search Section */}
      <div className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Enter city name (e.g., Mumbai, Delhi, Chennai)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <Button 
          onClick={() => handleSearch()} 
          disabled={loading || !searchQuery.trim()}
          className="shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
          Search
        </Button>
        <Button 
          variant="outline" 
          onClick={handleGetCurrentLocation}
          disabled={gpsLoading}
          className="shrink-0"
        >
          {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Navigation className="h-4 w-4 mr-2" />}
          Use GPS
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && !weatherData && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weather Data Display */}
      {weatherData && (
        <div className="space-y-6">
          {/* Weather Alert for Cached/Stale Data */}
          {(weatherData.cached || weatherData.error) && (
            <Alert className={weatherData.error ? "border-yellow-500" : "border-blue-500"}>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                {weatherData.error || "Showing cached weather data."}
                {weatherData.cached_until && ` Cache expires: ${new Date(weatherData.cached_until).toLocaleString()}`}
              </AlertDescription>
            </Alert>
          )}

          {/* Current Weather Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {weatherData.location.name}, {weatherData.location.country}
                </CardTitle>
                <CardDescription>
                  Last updated: {formatLastUpdated(weatherData.location.localtime, weatherData.cached, weatherData.cached_until)}
                  {weatherData.cached && <Badge variant="secondary" className="ml-2">Cached</Badge>}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Temperature */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center">
                    {weatherData.current.is_day ? 
                      <Sun className="h-8 w-8 text-yellow-500 mr-2" /> : 
                      <Cloud className="h-8 w-8 text-gray-500 mr-2" />
                    }
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{Math.round(weatherData.current.temp_c)}°C</div>
                    <div className="text-sm text-muted-foreground">
                      Feels like {Math.round(weatherData.current.feelslike_c)}°C
                    </div>
                    <div className="text-sm font-medium">{weatherData.current.condition.text}</div>
                  </div>
                </div>

                {/* Humidity */}
                <div className="text-center space-y-2">
                  <Droplets className="h-6 w-6 mx-auto text-blue-500" />
                  <div>
                    <div className="text-xl font-semibold">{weatherData.current.humidity}%</div>
                    <div className="text-sm text-muted-foreground">Humidity</div>
                  </div>
                </div>

                {/* Wind */}
                <div className="text-center space-y-2">
                  <Wind className="h-6 w-6 mx-auto text-gray-500" />
                  <div>
                    <div className="text-xl font-semibold">{Math.round(weatherData.current.wind_kph)} km/h</div>
                    <div className="text-sm text-muted-foreground">Wind Speed</div>
                  </div>
                </div>

                {/* Precipitation */}
                <div className="text-center space-y-2">
                  <Droplets className="h-6 w-6 mx-auto text-blue-600" />
                  <div>
                    <div className="text-xl font-semibold">{weatherData.current.precip_mm} mm</div>
                    <div className="text-sm text-muted-foreground">Precipitation</div>
                  </div>
                </div>
              </div>

              {/* UV Index */}
              <div className="mt-4 flex items-center justify-center space-x-2">
                <Eye className="h-4 w-4 text-orange-500" />
                <span className="text-sm">UV Index: {weatherData.current.uv}</span>
                <Badge variant={weatherData.current.uv > 7 ? "destructive" : weatherData.current.uv > 3 ? "secondary" : "default"}>
                  {weatherData.current.uv > 7 ? "High" : weatherData.current.uv > 3 ? "Moderate" : "Low"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 7-Day Forecast Chart */}
          <Card>
            <CardHeader>
              <CardTitle>7-Day Temperature Forecast</CardTitle>
              <CardDescription>Daily high and low temperatures with precipitation</CardDescription>
            </CardHeader>
            <CardContent>
              <WeatherForecastChart data={chartData} />
            </CardContent>
          </Card>

          {/* Detailed Daily Forecast */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed 7-Day Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {weatherData.forecast.map((day, index) => (
                  <div key={day.date} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium min-w-[80px]">
                        {index === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <img 
                        src={`https:${day.condition.icon}`} 
                        alt={day.condition.text}
                        className="w-8 h-8"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{day.condition.text}</div>
                        <div className="text-xs text-muted-foreground">
                          Rain: {day.daily_chance_of_rain}% | Wind: {Math.round(day.maxwind_kph)} km/h
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {Math.round(day.maxtemp_c)}° / {Math.round(day.mintemp_c)}°
                      </div>
                      {day.totalprecip_mm > 0 && (
                        <div className="text-xs text-blue-600">
                          {day.totalprecip_mm}mm rain
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Source */}
          <div className="text-center text-xs text-muted-foreground">
            Weather data provided by {weatherData.source}
          </div>
        </div>
      )}
    </div>
  );
}
