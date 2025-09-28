'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sprout, 
  Calendar, 
  Droplets, 
  Sparkles, 
  FileText, 
  RefreshCw,
  AlertCircle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const CropsList = ({ refreshTrigger }) => {
  const [crops, setCrops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchCrops = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch crops using the client-side Supabase instance
      const { data, error: fetchError } = await supabase
        .from('crops')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setCrops(data || []);
    } catch (err) {
      console.error('Error fetching crops:', err);
      setError(err.message);
      toast({
        title: '❌ Error',
        description: 'Failed to load crops',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, [refreshTrigger]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDaysToHarvest = (harvestDate) => {
    if (!harvestDate) return null;
    const today = new Date();
    const harvest = new Date(harvestDate);
    const diffTime = harvest - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getIrrigationBadgeColor = (type) => {
    const colors = {
      'drip': 'bg-blue-100 text-blue-800',
      'sprinkler': 'bg-green-100 text-green-800',
      'flood': 'bg-cyan-100 text-cyan-800',
      'rainfed': 'bg-gray-100 text-gray-800',
      'manual': 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-green-200">
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading crops: {error}</span>
          </div>
          <Button 
            onClick={fetchCrops} 
            variant="outline" 
            className="mt-4 border-red-200 text-red-600 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (crops.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-8 text-center">
          <Sprout className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">No Crops Added Yet</h3>
          <p className="text-green-600">Start by adding your first crop to track your farming activities.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-green-800">Your Crops ({crops.length})</h3>
        <Button onClick={fetchCrops} variant="outline" size="sm" className="border-green-200">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {crops.map((crop) => {
        const daysToHarvest = calculateDaysToHarvest(crop.expected_harvest_date);
        
        return (
          <Card key={crop.id} className="border-2 border-green-200 hover:border-green-300 transition-all duration-200 hover:shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-yellow-50 border-b border-green-100">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Sprout className="h-5 w-5" />
                    {crop.crop_name}
                    {crop.variety && (
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                        {crop.variety}
                      </Badge>
                    )}
                  </CardTitle>
                </div>
                {daysToHarvest !== null && (
                  <Badge 
                    className={`${
                      daysToHarvest <= 7 
                        ? 'bg-orange-100 text-orange-800' 
                        : daysToHarvest <= 30 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {daysToHarvest > 0 ? `${daysToHarvest} days to harvest` : 'Harvest time!'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-4">
              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {crop.planting_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Planted:</span>
                    <span className="text-sm font-medium">{formatDate(crop.planting_date)}</span>
                  </div>
                )}
                {crop.expected_harvest_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-gray-600">Harvest:</span>
                    <span className="text-sm font-medium">{formatDate(crop.expected_harvest_date)}</span>
                  </div>
                )}
              </div>

              {/* Irrigation */}
              {crop.irrigation_type && (
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Irrigation:</span>
                  <Badge className={getIrrigationBadgeColor(crop.irrigation_type)}>
                    {crop.irrigation_type.charAt(0).toUpperCase() + crop.irrigation_type.slice(1)}
                  </Badge>
                </div>
              )}

              {/* Fertilizer */}
              {crop.fertilizer_details && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-gray-600 font-medium">Fertilizer Details:</span>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border-l-2 border-purple-200">
                    {crop.fertilizer_details}
                  </p>
                </div>
              )}

              {/* Notes */}
              {crop.notes && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600 font-medium">Notes:</span>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border-l-2 border-gray-200">
                    {crop.notes}
                  </p>
                </div>
              )}

              {/* Creation date */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Added on {formatDate(crop.created_at)}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CropsList;
