'use client';

// ============================================================================
// ALL CROPS LIST COMPONENT
// Displays all crop records from the database
// ============================================================================

import React, { useState, useEffect } from 'react';
import { getAllCrops, deleteCrop, getCropStatistics, type Crop } from '@/lib/cropApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trash2, 
  MapPin, 
  Calendar, 
  Droplets, 
  Ruler, 
  Sprout, 
  TrendingUp,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AllCropsListProps {
  showStats?: boolean;
  allowDelete?: boolean;
  refreshTrigger?: number;
}

export default function AllCropsList({ 
  showStats = true, 
  allowDelete = false,
  refreshTrigger = 0
}: AllCropsListProps) {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [filteredCrops, setFilteredCrops] = useState<Crop[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchCropsData();
  }, [refreshTrigger]);

  useEffect(() => {
    filterCrops();
  }, [crops, searchTerm, statusFilter]);

  const fetchCropsData = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch crops and statistics in parallel
      const [cropsResult, statsResult] = await Promise.all([
        getAllCrops(),
        showStats ? getCropStatistics() : Promise.resolve({ data: null, error: null })
      ]);

      if (cropsResult.error) {
        throw new Error(cropsResult.error);
      }

      setCrops(cropsResult.data || []);
      
      if (showStats && statsResult.data) {
        setStats(statsResult.data);
      }

    } catch (err: any) {
      console.error('Error fetching crops data:', err);
      setError(err.message || 'Failed to load crops data');
    } finally {
      setLoading(false);
    }
  };

  const filterCrops = () => {
    let filtered = crops;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(crop =>
        crop.crop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (crop.location && crop.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        crop.crop_variety?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(crop => crop.status === statusFilter);
    }

    setFilteredCrops(filtered);
  };

  const handleDeleteCrop = async (id: string, cropName: string) => {
    if (!confirm(`Are you sure you want to delete "${cropName}"? This action cannot be undone.`)) {
      return;
    }

    setDeleteLoading(id);
    try {
      const result = await deleteCrop(id);
      if (result.error) {
        throw new Error(result.error);
      }

      // Remove from local state
      setCrops(prev => prev.filter(crop => crop.id !== String(id)));
      
      // Refresh stats
      if (showStats) {
        const statsResult = await getCropStatistics();
        if (statsResult.data) {
          setStats(statsResult.data);
        }
      }

    } catch (err: any) {
      console.error('Error deleting crop:', err);
      alert(`Failed to delete crop: ${err.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'harvested': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-3 text-gray-600">Loading crops...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-800">
          <strong>Error:</strong> {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchCropsData}
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center p-4">
              <Sprout className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Crops</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCrops}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <TrendingUp className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Crops</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeCrops}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <Calendar className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Harvested</p>
                <p className="text-2xl font-bold text-orange-600">{stats.harvestedCrops}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <Ruler className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Land</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalLandSize.toFixed(1)} acres
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search crops, locations, varieties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="harvested">Harvested</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={fetchCropsData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Crops List */}
      {filteredCrops.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sprout className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {crops.length === 0 ? 'No Crops Found' : 'No Matching Crops'}
            </h3>
            <p className="text-gray-500 text-center max-w-md">
              {crops.length === 0 
                ? 'Start by adding your first crop in the admin panel.' 
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCrops.map((crop) => (
            <Card key={crop.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-green-800 flex items-center">
                    <Sprout className="h-5 w-5 mr-2" />
                    {crop.crop_name}
                  </CardTitle>
                  <Badge className={getStatusColor(crop.status || undefined)}>
                    {crop.status || 'Unknown'}
                  </Badge>
                </div>
                {crop.crop_variety && (
                  <p className="text-sm text-gray-600 italic">
                    Variety: {crop.crop_variety}
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{crop.location}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Planted: {formatDate(crop.planting_date || undefined)}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Droplets className="h-4 w-4 mr-2" />
                    <span>{crop.irrigation_type}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Ruler className="h-4 w-4 mr-2" />
                    <span>{crop.land_size} {crop.land_size_unit || 'acres'}</span>
                  </div>
                </div>

                {crop.notes && (
                  <div className="bg-gray-50 p-2 rounded text-sm">
                    <strong>Notes:</strong> {crop.notes}
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-2 border-t">
                  <p>Last updated: {formatDate(crop.updated_at || undefined)}</p>
                </div>

                {allowDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteCrop(String(crop.id!), crop.crop_name)}
                    disabled={deleteLoading === String(crop.id)}
                    className="w-full mt-3"
                  >
                    {deleteLoading === String(crop.id) ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Crop
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
