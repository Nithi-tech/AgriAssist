import { NextRequest, NextResponse } from 'next/server';
import NodeCache from 'node-cache';

// Configure route for dynamic rendering
export const dynamic = 'force-dynamic';

// Initialize cache with TTL from environment variable (default 5 minutes for fresher data)
const CACHE_TTL_MINUTES = parseInt(process.env.WEATHER_CACHE_TTL_MIN || '5');
const cache = new NodeCache({ stdTTL: CACHE_TTL_MINUTES * 60 });

// WeatherAPI.com response interfaces
interface WeatherAPILocation {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  tz_id: string;
  localtime: string;
}

interface WeatherAPICondition {
  text: string;
  icon: string;
  code: number;
}

interface WeatherAPICurrent {
  temp_c: number;
  is_day: number;
  condition: WeatherAPICondition;
  wind_kph: number;
  humidity: number;
  precip_mm: number;
  feelslike_c: number;
  uv: number;
}

interface WeatherAPIForecastDay {
  date: string;
  day: {
    maxtemp_c: number;
    mintemp_c: number;
    avgtemp_c: number;
    daily_chance_of_rain: number;
    totalprecip_mm: number;
    maxwind_kph: number;
    condition: WeatherAPICondition;
  };
}

interface WeatherAPIResponse {
  location: WeatherAPILocation;
  current: WeatherAPICurrent;
  forecast: {
    forecastday: WeatherAPIForecastDay[];
  };
}

// Normalized response interface
interface WeatherResponse {
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
  forecast: Array<{
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
  }>;
  source: string;
  cached: boolean;
  cached_until?: string;
}

async function fetchWeatherData(query: string, days: number): Promise<WeatherAPIResponse> {
  const apiKey = process.env.WEATHERAPI_KEY;
  if (!apiKey) {
    throw new Error('WeatherAPI key not configured');
  }

  // Build WeatherAPI URLs
  const currentUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(query)}`;
  const forecastUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(query)}&days=${days}&aqi=no&alerts=no`;

  try {
    // Fetch both current and forecast data
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(currentUrl, { timeout: 15000 } as any),
      fetch(forecastUrl, { timeout: 15000 } as any)
    ]);

    // Check content types
    const currentContentType = currentResponse.headers.get('content-type') || '';
    const forecastContentType = forecastResponse.headers.get('content-type') || '';

    if (!currentContentType.includes('application/json')) {
      throw new Error('Unexpected non-JSON response from weather provider');
    }
    if (!forecastContentType.includes('application/json')) {
      throw new Error('Unexpected non-JSON response from weather provider');
    }

    // Check response status
    if (!currentResponse.ok) {
      const errorData = await currentResponse.json().catch(() => ({}));
      throw new Error(`Weather provider error: ${errorData.error?.message || currentResponse.statusText}`);
    }
    if (!forecastResponse.ok) {
      const errorData = await forecastResponse.json().catch(() => ({}));
      throw new Error(`Weather provider error: ${errorData.error?.message || forecastResponse.statusText}`);
    }

    // Parse JSON responses
    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    // Combine the responses
    return {
      location: forecastData.location,
      current: currentData.current,
      forecast: forecastData.forecast
    };

  } catch (error: any) {
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      throw new Error('Weather provider timeout');
    }
    throw error;
  }
}

function normalizeWeatherData(apiData: WeatherAPIResponse): WeatherResponse {
  return {
    location: {
      name: apiData.location.name,
      region: apiData.location.region,
      country: apiData.location.country,
      lat: apiData.location.lat,
      lon: apiData.location.lon,
      tz_id: apiData.location.tz_id,
      localtime: apiData.location.localtime
    },
    current: {
      temp_c: apiData.current.temp_c,
      is_day: apiData.current.is_day,
      condition: {
        text: apiData.current.condition.text,
        icon: apiData.current.condition.icon,
        code: apiData.current.condition.code
      },
      wind_kph: apiData.current.wind_kph,
      humidity: apiData.current.humidity,
      precip_mm: apiData.current.precip_mm,
      feelslike_c: apiData.current.feelslike_c,
      uv: apiData.current.uv
    },
    forecast: apiData.forecast.forecastday.map(day => ({
      date: day.date,
      maxtemp_c: day.day.maxtemp_c,
      mintemp_c: day.day.mintemp_c,
      avgtemp_c: day.day.avgtemp_c,
      daily_chance_of_rain: day.day.daily_chance_of_rain,
      totalprecip_mm: day.day.totalprecip_mm,
      maxwind_kph: day.day.maxwind_kph,
      condition: {
        text: day.day.condition.text,
        icon: day.day.condition.icon
      }
    })),
    source: 'weatherapi.com',
    cached: false
  };
}

export async function GET(req: NextRequest) {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' // Shorter browser cache
  };

  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('q');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const daysParam = searchParams.get('days');
    const forceRefresh = searchParams.get('force') === '1';
    const timestamp = searchParams.get('_t'); // Cache busting parameter
    
    // Validate input parameters
    let query: string;
    if (lat && lon) {
      // Prefer coordinates if both are provided
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      if (isNaN(latitude) || isNaN(longitude)) {
        return NextResponse.json(
          { error: 'Invalid coordinates provided' },
          { status: 400, headers }
        );
      }
      query = `${latitude},${longitude}`;
    } else if (city) {
      query = city.trim();
    } else {
      return NextResponse.json(
        { error: 'Either city name (q) or coordinates (lat,lon) must be provided' },
        { status: 400, headers }
      );
    }

    const days = Math.min(Math.max(parseInt(daysParam || '7'), 1), 10); // Limit to 1-10 days
    
    // Create cache key with timestamp for cache busting when needed
    const cacheKey = forceRefresh || timestamp ? `weather:${query}:${days}:${Date.now()}` : `weather:${query}:${days}`;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && !timestamp) {
      const cachedData = cache.get<WeatherResponse>(cacheKey);
      if (cachedData) {
        const cacheExpiry = new Date(Date.now() + (CACHE_TTL_MINUTES * 60 * 1000));
        return NextResponse.json({
          ...cachedData,
          cached: true,
          cached_until: cacheExpiry.toISOString()
        }, { headers });
      }
    }

    // Fetch fresh data from WeatherAPI
    const apiData = await fetchWeatherData(query, days);
    const normalizedData = normalizeWeatherData(apiData);
    
    // Cache the data (use base cache key for future cache hits)
    const baseCacheKey = `weather:${query}:${days}`;
    cache.set(baseCacheKey, normalizedData);
    
    return NextResponse.json(normalizedData, { headers });

  } catch (error: any) {
    console.error('Weather API Error:', {
      message: error.message,
      stack: error.stack?.split('\n')[0] // First line only for logs
    });

    // Check if we have cached data to fall back to
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('q');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const daysParam = searchParams.get('days');
    
    if (city || (lat && lon)) {
      let query: string;
      if (lat && lon) {
        query = `${lat},${lon}`;
      } else {
        query = city!.trim();
      }
      const days = Math.min(Math.max(parseInt(daysParam || '7'), 1), 10);
      const cacheKey = `weather:${query}:${days}`;
      
      const staleData = cache.get<WeatherResponse>(cacheKey);
      if (staleData) {
        console.log('Returning stale cached data due to API error');
        return NextResponse.json({
          ...staleData,
          cached: true,
          cached_until: new Date().toISOString(), // Expired
          error: 'Using cached data - weather service temporarily unavailable'
        }, { headers });
      }
    }

    // Determine error type and return appropriate response
    if (error.message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Weather provider timeout' },
        { status: 504, headers }
      );
    } else if (error.message.includes('Weather provider error')) {
      return NextResponse.json(
        { error: 'Weather provider error', detail: error.message },
        { status: 502, headers }
      );
    } else if (error.message.includes('non-JSON response')) {
      return NextResponse.json(
        { error: 'Unexpected non-JSON response from weather provider' },
        { status: 502, headers }
      );
    } else {
      return NextResponse.json(
        { error: 'Internal server error', detail: error.message },
        { status: 500, headers }
      );
    }
  }
}
