'use client';

// ============================================================================
// NEW ADMIN ADD CROP FORM - ALIGNED WITH EXACT DATABASE SCHEMA
// Complete form for adding crops with proper validation
// ============================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Sprout, 
  Save, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Calendar,
  MapPin,
  DollarSign
} from 'lucide-react';

interface NewCropFormProps {
  onCropAdded?: (crop: any) => void;
  onClose?: () => void;
}

export default function NewAdminCropForm({ onCropAdded, onClose }: NewCropFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Form state matching exact database schema
  const [formData, setFormData] = useState({
    crop_name: '',
    crop_variety: '',
    planting_date: '',
    expected_harvest_date: '',
    location: '',
    land_size: '',
    land_size_unit: 'acres',
    irrigation_type: '',
    soil_type: '',
    water_source: '',
    fertilizer_used: '',
    pesticide_used: '',
    estimated_yield: '',
    yield_unit: 'kg',
    cost_investment: '',
    status: 'active',
    season: '',
    farming_method: '',
    notes: ''
  });

  // Schema-aligned options
  const irrigationTypes = [
    { value: 'rainfed', label: 'Rainfed' },
    { value: 'drip', label: 'Drip Irrigation' },
    { value: 'sprinkler', label: 'Sprinkler' },
    { value: 'flood', label: 'Flood Irrigation' },
    { value: 'tube_well', label: 'Tube Well' },
    { value: 'canal', label: 'Canal' },
    { value: 'other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'planned', label: 'Planned' },
    { value: 'harvested', label: 'Harvested' },
    { value: 'failed', label: 'Failed' }
  ];

  const landSizeUnits = [
    { value: 'acres', label: 'Acres' },
    { value: 'hectares', label: 'Hectares' }
  ];

  const yieldUnits = [
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'tonnes', label: 'Tonnes' }
  ];

  const seasons = [
    { value: 'Kharif', label: 'Kharif (Monsoon)' },
    { value: 'Rabi', label: 'Rabi (Winter)' },
    { value: 'Summer', label: 'Summer' },
    { value: 'Year-round', label: 'Year-round' }
  ];

  const farmingMethods = [
    { value: 'Traditional', label: 'Traditional' },
    { value: 'Modern', label: 'Modern' },
    { value: 'Organic', label: 'Organic' },
    { value: 'Hydroponic', label: 'Hydroponic' },
    { value: 'Precision', label: 'Precision Agriculture' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear messages when user starts editing
    if (success) setSuccess(false);
    if (errors.length > 0) setErrors([]);
  };

  const validateForm = () => {
    const validationErrors: string[] = [];

    // Date validation
    if (formData.planting_date && formData.expected_harvest_date) {
      const plantingDate = new Date(formData.planting_date);
      const harvestDate = new Date(formData.expected_harvest_date);
      if (plantingDate > harvestDate) {
        validationErrors.push('Expected harvest date must be after planting date');
      }
    }

    // Positive number validations
    if (formData.land_size && parseFloat(formData.land_size) <= 0) {
      validationErrors.push('Land size must be greater than 0');
    }

    if (formData.estimated_yield && parseFloat(formData.estimated_yield) <= 0) {
      validationErrors.push('Estimated yield must be greater than 0');
    }

    if (formData.cost_investment && parseFloat(formData.cost_investment) <= 0) {
      validationErrors.push('Cost investment must be greater than 0');
    }

    return validationErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors([]);
    setSuccess(false);

    try {
      // Prepare data for API
      const cropData = {
        crop_name: formData.crop_name.trim() || 'Unknown Crop',
        crop_variety: formData.crop_variety.trim() || null,
        planting_date: formData.planting_date || null,
        expected_harvest_date: formData.expected_harvest_date || null,
        location: formData.location.trim() || null,
        land_size: formData.land_size ? parseFloat(formData.land_size) : null,
        land_size_unit: formData.land_size_unit,
        irrigation_type: formData.irrigation_type || null,
        soil_type: formData.soil_type.trim() || null,
        water_source: formData.water_source.trim() || null,
        fertilizer_used: formData.fertilizer_used.trim() || null,
        pesticide_used: formData.pesticide_used.trim() || null,
        estimated_yield: formData.estimated_yield ? parseFloat(formData.estimated_yield) : null,
        yield_unit: formData.yield_unit,
        cost_investment: formData.cost_investment ? parseFloat(formData.cost_investment) : null,
        status: formData.status,
        season: formData.season || null,
        farming_method: formData.farming_method || null,
        notes: formData.notes.trim() || null
      };

      console.log('🌱 Submitting crop data:', cropData);

      const response = await fetch('/api/crops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cropData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details ? result.details.join(', ') : result.error);
      }

      console.log('✅ Crop created successfully:', result.data);
      setSuccess(true);
      
      // Reset form
      setFormData({
        crop_name: '',
        crop_variety: '',
        planting_date: '',
        expected_harvest_date: '',
        location: '',
        land_size: '',
        land_size_unit: 'acres',
        irrigation_type: '',
        soil_type: '',
        water_source: '',
        fertilizer_used: '',
        pesticide_used: '',
        estimated_yield: '',
        yield_unit: 'kg',
        cost_investment: '',
        status: 'active',
        season: '',
        farming_method: '',
        notes: ''
      });

      // Callback to parent component
      if (onCropAdded) {
        onCropAdded(result.data);
      }

      // Auto-hide success message
      setTimeout(() => {
        setSuccess(false);
        if (onClose) onClose();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error creating crop:', error);
      setErrors([error.message || 'Failed to create crop']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="space-y-2">
        <div className="flex items-center space-x-2">
          <Sprout className="h-6 w-6 text-green-600" />
          <CardTitle className="text-2xl font-bold text-gray-800">
            Add New Crop
          </CardTitle>
        </div>
        <p className="text-gray-600">
          Add a new crop to your agricultural management system
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Success Message */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              🎉 Crop added successfully! The new crop has been saved to your database.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Messages */}
        {errors.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Crop Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="crop_name" className="flex items-center space-x-1">
                <span>Crop Name</span>
                <Badge variant="secondary" className="text-xs">Required</Badge>
              </Label>
              <Input
                id="crop_name"
                value={formData.crop_name}
                onChange={(e) => handleInputChange('crop_name', e.target.value)}
                placeholder="e.g., Rice, Wheat, Tomato"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="crop_variety">Crop Variety</Label>
              <Input
                id="crop_variety"
                value={formData.crop_variety}
                onChange={(e) => handleInputChange('crop_variety', e.target.value)}
                placeholder="e.g., Basmati, HD-2967"
                className="mt-1"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="planting_date" className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Planting Date</span>
              </Label>
              <Input
                id="planting_date"
                type="date"
                value={formData.planting_date}
                onChange={(e) => handleInputChange('planting_date', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="expected_harvest_date" className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Expected Harvest Date</span>
              </Label>
              <Input
                id="expected_harvest_date"
                type="date"
                value={formData.expected_harvest_date}
                onChange={(e) => handleInputChange('expected_harvest_date', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Location and Land Size */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="location" className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>Location</span>
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Punjab, India"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="land_size">Land Size</Label>
              <Input
                id="land_size"
                type="number"
                step="0.01"
                min="0"
                value={formData.land_size}
                onChange={(e) => handleInputChange('land_size', e.target.value)}
                placeholder="e.g., 5.5"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="land_size_unit">Land Size Unit</Label>
              <Select value={formData.land_size_unit} onValueChange={(value) => handleInputChange('land_size_unit', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {landSizeUnits.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Agricultural Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="irrigation_type">Irrigation Type</Label>
              <Select value={formData.irrigation_type} onValueChange={(value) => handleInputChange('irrigation_type', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select irrigation type" />
                </SelectTrigger>
                <SelectContent>
                  {irrigationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="soil_type">Soil Type</Label>
              <Input
                id="soil_type"
                value={formData.soil_type}
                onChange={(e) => handleInputChange('soil_type', e.target.value)}
                placeholder="e.g., Clay, Loamy, Sandy"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="water_source">Water Source</Label>
              <Input
                id="water_source"
                value={formData.water_source}
                onChange={(e) => handleInputChange('water_source', e.target.value)}
                placeholder="e.g., Canal, Tube Well, Borewell"
                className="mt-1"
              />
            </div>
          </div>

          {/* Inputs Used */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fertilizer_used">Fertilizer Used</Label>
              <Input
                id="fertilizer_used"
                value={formData.fertilizer_used}
                onChange={(e) => handleInputChange('fertilizer_used', e.target.value)}
                placeholder="e.g., NPK, Urea, Organic Compost"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="pesticide_used">Pesticide Used</Label>
              <Input
                id="pesticide_used"
                value={formData.pesticide_used}
                onChange={(e) => handleInputChange('pesticide_used', e.target.value)}
                placeholder="e.g., Bio-pesticide, Chemical spray"
                className="mt-1"
              />
            </div>
          </div>

          {/* Yield and Cost */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="estimated_yield">Estimated Yield</Label>
              <Input
                id="estimated_yield"
                type="number"
                step="0.01"
                min="0"
                value={formData.estimated_yield}
                onChange={(e) => handleInputChange('estimated_yield', e.target.value)}
                placeholder="e.g., 3000"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="yield_unit">Yield Unit</Label>
              <Select value={formData.yield_unit} onValueChange={(value) => handleInputChange('yield_unit', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yieldUnits.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="cost_investment" className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4" />
                <span>Cost Investment</span>
              </Label>
              <Input
                id="cost_investment"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_investment}
                onChange={(e) => handleInputChange('cost_investment', e.target.value)}
                placeholder="e.g., 50000"
                className="mt-1"
              />
            </div>
          </div>

          {/* Status and Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="season">Season</Label>
              <Select value={formData.season} onValueChange={(value) => handleInputChange('season', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season.value} value={season.value}>
                      {season.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="farming_method">Farming Method</Label>
              <Select value={formData.farming_method} onValueChange={(value) => handleInputChange('farming_method', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select farming method" />
                </SelectTrigger>
                <SelectContent>
                  {farmingMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this crop..."
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Adding Crop...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Add Crop
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
