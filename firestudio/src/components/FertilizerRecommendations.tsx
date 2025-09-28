/**
 * Fertilizer Recommendations Component
 * Displays real-time fertilizer recommendations based on soil nutrient levels
 */

'use client';

import React from 'react';
import { useFertilizerRecommendations } from '@/hooks/useFertilizerRecommendations';
import { AlertMessage } from '@/lib/fertilizer-recommendations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Leaf, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useClientDate } from '@/lib/date-utils';

interface FertilizerRecommendationsProps {
  deviceId?: string;
  cropId?: string;
  pollInterval?: number;
  showTrends?: boolean;
  showLatestReading?: boolean;
  className?: string;
}

const FertilizerRecommendations: React.FC<FertilizerRecommendationsProps> = ({
  deviceId,
  cropId,
  pollInterval = 30000,
  showTrends = true,
  showLatestReading = true,
  className = ''
}) => {
  const { formatDateTime } = useClientDate();
  const {
    data,
    loading,
    error,
    refetch,
    hasAlerts,
    criticalAlerts,
    moderateAlerts,
    lowAlerts
  } = useFertilizerRecommendations({
    deviceId,
    cropId,
    pollInterval
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'moderate':
        return <AlertCircle className="h-4 w-4" />;
      case 'low':
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'moderate':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      case 'stable':
        return <Minus className="h-3 w-3 text-gray-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const renderAlert = (alert: AlertMessage) => (
    <Alert key={`${alert.nutrient}-${alert.value}`} className="mb-3">
      <div className="flex items-start space-x-2">
        {getSeverityIcon(alert.severity)}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium">{alert.nutrient}</span>
            <Badge variant={getSeverityColor(alert.severity) as any}>
              {alert.value} ppm
            </Badge>
          </div>
          <AlertDescription className="text-sm">
            {alert.message}
          </AlertDescription>
          <div className="mt-2 flex flex-wrap gap-1">
            {alert.fertilizers.map(fertilizer => (
              <Badge key={fertilizer} variant="outline" className="text-xs">
                <Leaf className="h-3 w-3 mr-1" />
                {fertilizer}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Alert>
  );

  if (loading && !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Leaf className="h-5 w-5" />
            <span>Fertilizer Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading recommendations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Leaf className="h-5 w-5" />
              <span>Fertilizer Recommendations</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Error loading recommendations: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Recommendations Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Leaf className="h-5 w-5" />
              <span>Fertilizer Recommendations</span>
              {hasAlerts && (
                <Badge variant="destructive" className="ml-2">
                  {data.alerts.length} Alert{data.alerts.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {data.lastUpdated && (
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDateTime(data.lastUpdated)}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasAlerts ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                All nutrient levels are optimal. No immediate fertilizer application needed.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {/* Critical Alerts */}
              {criticalAlerts.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Critical Levels ({criticalAlerts.length})
                  </h4>
                  {criticalAlerts.map(renderAlert)}
                </div>
              )}

              {/* Moderate Alerts */}
              {moderateAlerts.length > 0 && (
                <div>
                  <h4 className="font-medium text-orange-600 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Moderate Levels ({moderateAlerts.length})
                  </h4>
                  {moderateAlerts.map(renderAlert)}
                </div>
              )}

              {/* Low Priority Alerts */}
              {lowAlerts.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-600 mb-2 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Monitor Levels ({lowAlerts.length})
                  </h4>
                  {lowAlerts.map(renderAlert)}
                </div>
              )}
            </div>
          )}

          {/* General Recommendations */}
          {data.recommendations && data.recommendations.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">General Recommendations:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {data.recommendations.map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Latest Reading Card */}
      {showLatestReading && data.latestReading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Latest Nutrient Reading</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Nitrogen (N)</div>
                <div className="text-xl font-bold">{data.latestReading.nitrogen}</div>
                <div className="text-xs text-gray-500">ppm (mg/kg)</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Phosphorus (P)</div>
                <div className="text-xl font-bold">{data.latestReading.phosphorus}</div>
                <div className="text-xs text-gray-500">ppm (available)</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Potassium (K)</div>
                <div className="text-xl font-bold">{data.latestReading.potassium}</div>
                <div className="text-xs text-gray-500">ppm</div>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500 text-center">
              Recorded: {formatDateTime(data.latestReading.timestamp)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trends Card */}
      {showTrends && Object.keys(data.trends).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nutrient Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.trends).map(([nutrient, trend]) => (
                <div key={nutrient} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="capitalize font-medium">{nutrient}</span>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(trend)}
                    <span className="text-sm capitalize">{trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FertilizerRecommendations;
