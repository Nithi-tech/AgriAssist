/**
 * React Hook: Fertilizer Recommendations
 * Manages real-time fertilizer recommendations and alerts
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertMessage } from '@/lib/fertilizer-recommendations';

interface FertilizerRecommendationData {
  alerts: AlertMessage[];
  simpleAlerts?: AlertMessage[];
  trends: Record<string, 'improving' | 'declining' | 'stable'>;
  recommendations: string[];
  latestReading?: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    timestamp: string;
    deviceId: string;
    cropId?: number;
  };
  totalReadings: number;
  lastUpdated: string;
}

interface UseFertilizerRecommendationsOptions {
  deviceId?: string;
  cropId?: string;
  pollInterval?: number; // in milliseconds, default 30 seconds
  enabled?: boolean;
}

interface UseFertilizerRecommendationsReturn {
  data: FertilizerRecommendationData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasAlerts: boolean;
  criticalAlerts: AlertMessage[];
  moderateAlerts: AlertMessage[];
  lowAlerts: AlertMessage[];
}

export function useFertilizerRecommendations(
  options: UseFertilizerRecommendationsOptions = {}
): UseFertilizerRecommendationsReturn {
  const {
    deviceId,
    cropId,
    pollInterval = 30000, // 30 seconds default
    enabled = true
  } = options;

  const [data, setData] = useState<FertilizerRecommendationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!enabled) return;

    try {
      const params = new URLSearchParams();
      if (deviceId) params.append('deviceId', deviceId);
      if (cropId) params.append('cropId', cropId);
      params.append('limit', '10');

      const response = await fetch(`/api/fertilizer-recommendations?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch recommendations');
        console.error('Fertilizer recommendations API error:', result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      console.error('Error fetching fertilizer recommendations:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceId, cropId, enabled]);

  // Initial fetch and setup polling
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    fetchRecommendations();

    // Set up polling interval
    if (pollInterval > 0) {
      intervalRef.current = setInterval(fetchRecommendations, pollInterval);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchRecommendations, pollInterval, enabled]);

  // Process alerts by severity
  const criticalAlerts = data?.alerts.filter(alert => alert.severity === 'critical') || [];
  const moderateAlerts = data?.alerts.filter(alert => alert.severity === 'moderate') || [];
  const lowAlerts = data?.alerts.filter(alert => alert.severity === 'low') || [];
  const hasAlerts = (data?.alerts.length || 0) > 0;

  return {
    data,
    loading,
    error,
    refetch: fetchRecommendations,
    hasAlerts,
    criticalAlerts,
    moderateAlerts,
    lowAlerts
  };
}

/**
 * Hook for manual nutrient level checking (useful for forms or manual input)
 */
export function useManualNutrientCheck() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkNutrients = useCallback(async (nitrogen: number, phosphorus: number, potassium: number): Promise<AlertMessage[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/fertilizer-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nitrogen, phosphorus, potassium })
      });

      const result = await response.json();

      if (result.success) {
        return result.data.alerts;
      } else {
        setError(result.error || 'Failed to check nutrients');
        return [];
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    checkNutrients,
    loading,
    error
  };
}
