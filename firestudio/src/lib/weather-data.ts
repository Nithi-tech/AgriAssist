import type { LucideIcon } from 'lucide-react';
import { Sun, Cloud, CloudRain, CloudSun, Wind, Snowflake } from 'lucide-react';

export interface DailyForecast {
  day: string;
  Icon: LucideIcon;
  temp: number;
  description: string;
}

export const mockWeatherData: DailyForecast[] = [
  { day: 'Mon', Icon: CloudSun, temp: 28, description: 'Partly Cloudy' },
  { day: 'Tue', Icon: Sun, temp: 32, description: 'Sunny' },
  { day: 'Wed', Icon: CloudRain, temp: 25, description: 'Rainy' },
  { day: 'Thu', Icon: Cloud, temp: 26, description: 'Cloudy' },
  { day: 'Fri', Icon: Sun, temp: 30, description: 'Sunny' },
  { day: 'Sat', Icon: CloudRain, temp: 24, description: 'Showers' },
  { day: 'Sun', Icon: CloudSun, temp: 29, description: 'Partly Cloudy' },
];
