'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WeatherChartData {
  date: string;
  maxTemp: number;
  minTemp: number;
  precipitation: number;
  chanceOfRain: number;
}

interface WeatherForecastChartProps {
  data: WeatherChartData[];
}

export function WeatherForecastChart({ data }: WeatherForecastChartProps) {
  // Temperature Chart Data
  const temperatureData = {
    labels: data.map(day => day.date),
    datasets: [
      {
        label: 'Max Temperature (°C)',
        data: data.map(day => day.maxTemp),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
        tension: 0.4,
      },
      {
        label: 'Min Temperature (°C)',
        data: data.map(day => day.minTemp),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: false,
        tension: 0.4,
      },
    ],
  };

  // Precipitation Chart Data
  const precipitationData = {
    labels: data.map(day => day.date),
    datasets: [
      {
        label: 'Precipitation (mm)',
        data: data.map(day => day.precipitation),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Chance of Rain (%)',
        data: data.map(day => day.chanceOfRain),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  };

  const temperatureOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Temperature Forecast',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Temperature (°C)',
        },
      },
    },
  };

  const precipitationOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Precipitation & Rain Chance',
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Precipitation (mm)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Chance of Rain (%)',
        },
        grid: {
          drawOnChartArea: false,
        },
        max: 100,
      },
    },
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No weather data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Temperature Chart */}
      <div className="h-80">
        <Line data={temperatureData} options={temperatureOptions} />
      </div>
      
      {/* Precipitation Chart */}
      <div className="h-80">
        <Bar data={precipitationData} options={precipitationOptions} />
      </div>
    </div>
  );
}
