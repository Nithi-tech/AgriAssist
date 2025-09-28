'use client';

// ============================================================================
// MY CROP COMPONENT
// Displays only the latest updated crop record (read-only)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { getLatestCrop, type Crop } from '@/lib/cropApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Calendar, 
  Droplets, 
  Ruler, 
  Sprout, 
  Leaf,
  Sun,
  DollarSign,
  FileText,
  RefreshCw,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

interface MyCropProps {
  refreshTrigger?: number;
}

export default function MyCrop({ refreshTrigger = 0 }: MyCropProps) {
  const [crop, setCrop] = useState<Crop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchLatestCrop();
  }, [refreshTrigger]);

  const fetchLatestCrop = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getLatestCrop();
      
      if (result.error) {
        if (result.error === 'No crops found') {
          setCrop(null);
        } else {
          throw new Error(result.error);
        }
      } else {
        setCrop(result.data);
      }

    } catch (err: any) {
      console.error('Error fetching latest crop:', err);
      setError(err.message || 'Failed to load crop data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'harvested': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active': return <TrendingUp className="h-4 w-4" />;
      case 'harvested': return <Sprout className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <Leaf className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysFromPlanting = (plantingDate?: string) => {
    if (!plantingDate) return null;
    const planted = new Date(plantingDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - planted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-3 text-gray-600">Loading your latest crop...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-red-800">
          <strong>Error:</strong> {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchLatestCrop}
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!crop) {
    return (
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Sprout className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Crops Found</h3>
          <p className="text-gray-500 text-center max-w-md mb-4">
            You haven't added any crops yet. Visit the admin panel to add your first crop and start tracking your agricultural journey.
          </p>
          <Button variant="outline" onClick={fetchLatestCrop}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const daysFromPlanting = getDaysFromPlanting(crop.planting_date || undefined);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl text-green-800 flex items-center">
                <Sprout className="h-6 w-6 mr-2" />
                {crop.crop_name}
              </CardTitle>
              {crop.crop_variety && (
                <p className="text-green-600 mt-1 font-medium">
                  Variety: {crop.crop_variety}
                </p>
              )}
            </div>
            <div className="text-right">
              <Badge className={getStatusColor(crop.status || undefined)} variant="outline">
                {getStatusIcon(crop.status || undefined)}
                <span className="ml-1 capitalize">{crop.status || 'Unknown'}</span>
              </Badge>
              {daysFromPlanting && (
                <p className="text-sm text-gray-600 mt-2">
                  Day {daysFromPlanting} from planting
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Location & Size */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center text-blue-700">
              <MapPin className="h-5 w-5 mr-2" />
              Location & Size
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Location</p>
              <p className="text-lg">{crop.location}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Land Size</p>
              <p className="text-lg font-semibold text-blue-600">
                {crop.land_size} {crop.land_size_unit || 'acres'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Planting Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center text-green-700">
              <Calendar className="h-5 w-5 mr-2" />
              Planting Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Planted On</p>
              <p className="text-lg">{formatShortDate(crop.planting_date || undefined)}</p>
            </div>
            {crop.expected_harvest_date && (
              <div>
                <p className="text-sm font-medium text-gray-600">Expected Harvest</p>
                <p className="text-lg">{formatShortDate(crop.expected_harvest_date)}</p>
              </div>
            )}
            {crop.season && (
              <div>
                <p className="text-sm font-medium text-gray-600">Season</p>
                <p className="text-lg capitalize">{crop.season}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Irrigation & Water */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center text-cyan-700">
              <Droplets className="h-5 w-5 mr-2" />
              Water Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Irrigation Type</p>
              <p className="text-lg">{crop.irrigation_type}</p>
            </div>
            {crop.water_source && (
              <div>
                <p className="text-sm font-medium text-gray-600">Water Source</p>
                <p className="text-lg">{crop.water_source}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Soil & Farming */}
        {(crop.soil_type || crop.farming_method) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center text-amber-700">
                <Sun className="h-5 w-5 mr-2" />
                Farming Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {crop.soil_type && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Soil Type</p>
                  <p className="text-lg">{crop.soil_type}</p>
                </div>
              )}
              {crop.farming_method && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Method</p>
                  <p className="text-lg capitalize">{crop.farming_method}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Yield Information */}
        {(crop.estimated_yield || crop.cost_investment) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center text-purple-700">
                <TrendingUp className="h-5 w-5 mr-2" />
                Yield & Investment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {crop.estimated_yield && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Expected Yield</p>
                  <p className="text-lg font-semibold text-purple-600">
                    {crop.estimated_yield} {crop.yield_unit || 'kg'}
                  </p>
                </div>
              )}
              {crop.cost_investment && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Investment</p>
                  <p className="text-lg font-semibold text-green-600">
                    ₹{crop.cost_investment.toLocaleString('en-IN')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Inputs Used */}
        {(crop.fertilizer_used || crop.pesticide_used) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center text-orange-700">
                <Leaf className="h-5 w-5 mr-2" />
                Inputs Used
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {crop.fertilizer_used && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Fertilizer</p>
                  <p className="text-sm">{crop.fertilizer_used}</p>
                </div>
              )}
              {crop.pesticide_used && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Pesticide</p>
                  <p className="text-sm">{crop.pesticide_used}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notes Section */}
      {crop.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-gray-700">
              <FileText className="h-5 w-5 mr-2" />
              Notes & Observations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800 leading-relaxed">{crop.notes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer Info */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="py-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Last updated: {formatDate(crop.updated_at || undefined)}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchLatestCrop}
              className="text-gray-600 hover:text-gray-800"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
