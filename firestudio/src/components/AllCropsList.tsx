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
  Filter,
  Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientDate } from '@/lib/date-utils';

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
  
  // Use client-safe date formatting
  const { formatDate } = useClientDate();

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
    <div className="space-y-8">
      {/* Enhanced Statistics Cards */}
      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="flex items-center p-6">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <Sprout className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Total Crops</p>
                <p className="text-3xl font-bold text-green-800">{stats.totalCrops}</p>
                <p className="text-xs text-green-600 mt-1">In your database</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="flex items-center p-6">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Active Crops</p>
                <p className="text-3xl font-bold text-blue-800">{stats.activeCrops}</p>
                <p className="text-xs text-blue-600 mt-1">Currently growing</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="flex items-center p-6">
              <div className="bg-orange-100 p-3 rounded-full mr-4">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700">Harvested</p>
                <p className="text-3xl font-bold text-orange-800">{stats.harvestedCrops}</p>
                <p className="text-xs text-orange-600 mt-1">Successfully completed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="flex items-center p-6">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <Ruler className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700">Total Land</p>
                <p className="text-3xl font-bold text-purple-800">
                  {stats.totalLandSize.toFixed(1)}
                </p>
                <p className="text-xs text-purple-600 mt-1">acres cultivated</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Filters Section */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search crops, locations, varieties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-lg border-gray-300 focus:border-green-500 bg-white"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-56 h-12 border-gray-300 focus:border-green-500 bg-white">
                <Filter className="h-5 w-5 mr-2 text-gray-500" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">🌱 Active</SelectItem>
                <SelectItem value="harvested">🌾 Harvested</SelectItem>
                <SelectItem value="failed">❌ Failed</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={fetchCropsData}
              className="h-12 px-6 border-green-300 text-green-700 hover:bg-green-50 font-semibold"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh
            </Button>
          </div>
          
          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredCrops.length} of {crops.length} crops
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Crops Grid */}
      {filteredCrops.length === 0 ? (
        <Card className="bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-gray-100 p-6 rounded-full mb-6">
              <Sprout className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              {crops.length === 0 ? 'No Crops Found' : 'No Matching Crops'}
            </h3>
            <p className="text-gray-600 text-center max-w-md text-lg">
              {crops.length === 0 
                ? 'Start by adding your first crop in the admin panel to track your farming journey.' 
                : 'Try adjusting your search or filter criteria to find the crops you\'re looking for.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCrops.map((crop) => (
            <Card key={crop.id} className="bg-gradient-to-br from-white to-green-50 border-green-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="text-xl text-green-800 flex items-center group-hover:text-green-900 transition-colors">
                      <div className="bg-green-100 p-2 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                        <Sprout className="h-6 w-6 text-green-600" />
                      </div>
                      {crop.crop_name}
                    </CardTitle>
                    {crop.crop_variety && (
                      <p className="text-sm text-green-600 italic font-medium ml-11">
                        🌿 {crop.crop_variety}
                      </p>
                    )}
                  </div>
                  <Badge className={`${getStatusColor(crop.status || undefined)} px-3 py-1 font-semibold text-sm`}>
                    {crop.status === 'active' && '🌱'}
                    {crop.status === 'harvested' && '🌾'}
                    {crop.status === 'failed' && '❌'}
                    {!crop.status && '❓'}
                    {' '}
                    {crop.status || 'Unknown'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center text-sm text-gray-700 bg-white/60 p-3 rounded-lg border border-green-100">
                    <MapPin className="h-5 w-5 mr-3 text-green-600" />
                    <div>
                      <span className="font-medium">Location</span>
                      <p className="text-gray-600">{crop.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-700 bg-white/60 p-3 rounded-lg border border-green-100">
                    <Calendar className="h-5 w-5 mr-3 text-blue-600" />
                    <div>
                      <span className="font-medium">Planted Date</span>
                      <p className="text-gray-600">{formatDate(crop.planting_date || undefined)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center text-sm text-gray-700 bg-white/60 p-3 rounded-lg border border-green-100">
                      <Droplets className="h-5 w-5 mr-2 text-cyan-600" />
                      <div>
                        <span className="font-medium text-xs">Irrigation</span>
                        <p className="text-gray-600 text-xs">{crop.irrigation_type}</p>
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-700 bg-white/60 p-3 rounded-lg border border-green-100">
                      <Ruler className="h-5 w-5 mr-2 text-purple-600" />
                      <div>
                        <span className="font-medium text-xs">Land Size</span>
                        <p className="text-gray-600 text-xs">{crop.land_size} {crop.land_size_unit || 'acres'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {crop.notes && (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong className="text-yellow-900">📝 Notes:</strong> {crop.notes}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-3 border-t border-green-200 bg-white/40 px-3 py-2 rounded-lg">
                  <p className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Last updated: {formatDate(crop.updated_at || undefined)}
                  </p>
                </div>

                {allowDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteCrop(String(crop.id!), crop.crop_name)}
                    disabled={deleteLoading === String(crop.id)}
                    className="w-full mt-4 bg-red-500 hover:bg-red-600 font-semibold"
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
