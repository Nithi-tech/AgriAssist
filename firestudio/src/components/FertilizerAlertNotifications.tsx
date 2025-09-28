/**
 * Fertilizer Alert Notifications
 * Compact component for showing fertilizer alerts in navigation or sidebar
 */

'use client';

import React from 'react';
import { useFertilizerRecommendations } from '@/hooks/useFertilizerRecommendations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  Leaf
} from 'lucide-react';

interface FertilizerAlertNotificationsProps {
  deviceId?: string;
  cropId?: string;
  showCount?: boolean;
  pollInterval?: number;
}

const FertilizerAlertNotifications: React.FC<FertilizerAlertNotificationsProps> = ({
  deviceId,
  cropId,
  showCount = true,
  pollInterval = 60000 // 1 minute for notifications
}) => {
  const {
    data,
    loading,
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
        return <AlertTriangle className="h-3 w-3" />;
      case 'moderate':
        return <AlertCircle className="h-3 w-3" />;
      case 'low':
        return <Info className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600';
      case 'moderate':
        return 'text-orange-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const totalAlerts = (data?.alerts.length || 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          disabled={loading}
        >
          <Bell className="h-4 w-4" />
          {hasAlerts && showCount && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 px-1 py-0 text-xs min-w-[16px] h-4"
            >
              {totalAlerts}
            </Badge>
          )}
          {!hasAlerts && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center space-x-2">
          <Leaf className="h-4 w-4" />
          <span>Fertilizer Alerts</span>
          {hasAlerts && (
            <Badge variant="outline" className="ml-auto">
              {totalAlerts} Alert{totalAlerts !== 1 ? 's' : ''}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading && (
          <DropdownMenuItem disabled>
            <span className="text-sm text-gray-500">Loading...</span>
          </DropdownMenuItem>
        )}

        {!loading && !hasAlerts && (
          <DropdownMenuItem disabled>
            <div className="flex items-center space-x-2 text-green-600">
              <Info className="h-3 w-3" />
              <span className="text-sm">All nutrient levels optimal</span>
            </div>
          </DropdownMenuItem>
        )}

        {/* Critical Alerts */}
        {criticalAlerts.map((alert, index) => (
          <DropdownMenuItem key={`critical-${index}`} className="flex-col items-start space-y-1 p-3">
            <div className="flex items-center space-x-2 w-full">
              <div className={getSeverityColor(alert.severity)}>
                {getSeverityIcon(alert.severity)}
              </div>
              <span className="font-medium text-sm">{alert.nutrient}</span>
              <Badge variant="destructive" className="ml-auto text-xs">
                {alert.value} ppm
              </Badge>
            </div>
            <p className="text-xs text-gray-600 leading-tight">
              Critical level requires immediate attention
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {alert.fertilizers.slice(0, 2).map(fertilizer => (
                <Badge key={fertilizer} variant="outline" className="text-xs px-1 py-0">
                  {fertilizer}
                </Badge>
              ))}
              {alert.fertilizers.length > 2 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{alert.fertilizers.length - 2} more
                </Badge>
              )}
            </div>
          </DropdownMenuItem>
        ))}

        {/* Moderate Alerts */}
        {moderateAlerts.map((alert, index) => (
          <DropdownMenuItem key={`moderate-${index}`} className="flex-col items-start space-y-1 p-3">
            <div className="flex items-center space-x-2 w-full">
              <div className={getSeverityColor(alert.severity)}>
                {getSeverityIcon(alert.severity)}
              </div>
              <span className="font-medium text-sm">{alert.nutrient}</span>
              <Badge variant="default" className="ml-auto text-xs">
                {alert.value} ppm
              </Badge>
            </div>
            <p className="text-xs text-gray-600 leading-tight">
              Moderate level - plan fertilization
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {alert.fertilizers.slice(0, 2).map(fertilizer => (
                <Badge key={fertilizer} variant="outline" className="text-xs px-1 py-0">
                  {fertilizer}
                </Badge>
              ))}
              {alert.fertilizers.length > 2 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{alert.fertilizers.length - 2} more
                </Badge>
              )}
            </div>
          </DropdownMenuItem>
        ))}

        {/* Low Priority Alerts (limit to 2) */}
        {lowAlerts.slice(0, 2).map((alert, index) => (
          <DropdownMenuItem key={`low-${index}`} className="flex-col items-start space-y-1 p-3">
            <div className="flex items-center space-x-2 w-full">
              <div className={getSeverityColor(alert.severity)}>
                {getSeverityIcon(alert.severity)}
              </div>
              <span className="font-medium text-sm">{alert.nutrient}</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {alert.value} ppm
              </Badge>
            </div>
            <p className="text-xs text-gray-600 leading-tight">
              Monitor level - consider fertilization
            </p>
          </DropdownMenuItem>
        ))}

        {lowAlerts.length > 2 && (
          <DropdownMenuItem disabled>
            <span className="text-xs text-gray-500">
              +{lowAlerts.length - 2} more monitoring alerts
            </span>
          </DropdownMenuItem>
        )}

        {hasAlerts && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/fertilizer-recommendations" className="text-sm text-blue-600 cursor-pointer">
                View detailed recommendations →
              </a>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FertilizerAlertNotifications;
