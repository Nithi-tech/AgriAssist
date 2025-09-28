'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Sprout, Calendar, Droplets, Sparkles } from 'lucide-react';

const AddCrop = ({ onCropAdded }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    crop_name: '',
    variety: '',
    planting_date: '',
    expected_harvest_date: '',
    irrigation_type: '',
    fertilizer_details: '',
    notes: '',
  });
  const { toast } = useToast();

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/crops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'super-secret-admin-token', // In production, get this from secure storage
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add crop');
      }

      // Reset form
      setFormData({
        crop_name: '',
        variety: '',
        planting_date: '',
        expected_harvest_date: '',
        irrigation_type: '',
        fertilizer_details: '',
        notes: '',
      });

      toast({
        title: '🌱 Crop Added Successfully!',
        description: `${result.data.crop_name} has been added to your farm.`,
      });

      // Notify parent component to refresh the list
      if (onCropAdded) {
        onCropAdded(result.data);
      }

    } catch (error) {
      console.error('Error adding crop:', error);
      toast({
        title: '❌ Error',
        description: error.message || 'Failed to add crop',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-2 border-green-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-yellow-50 border-b border-green-100">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <div className="bg-green-500 p-2 rounded-full">
            <Plus className="h-5 w-5 text-white" />
          </div>
          Add New Crop
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Crop Name and Variety */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="crop_name" className="flex items-center gap-2 font-medium text-green-700">
                <Sprout className="h-4 w-4" />
                Crop Name *
              </Label>
              <Input
                id="crop_name"
                type="text"
                value={formData.crop_name}
                onChange={(e) => handleInputChange('crop_name', e.target.value)}
                placeholder="e.g., Rice, Wheat, Tomato"
                required
                className="border-green-200 focus:border-green-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variety" className="font-medium text-green-700">
                Variety
              </Label>
              <Input
                id="variety"
                type="text"
                value={formData.variety}
                onChange={(e) => handleInputChange('variety', e.target.value)}
                placeholder="e.g., Basmati, Local variety"
                className="border-green-200 focus:border-green-400"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planting_date" className="flex items-center gap-2 font-medium text-green-700">
                <Calendar className="h-4 w-4" />
                Planting Date
              </Label>
              <Input
                id="planting_date"
                type="date"
                value={formData.planting_date}
                onChange={(e) => handleInputChange('planting_date', e.target.value)}
                className="border-green-200 focus:border-green-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected_harvest_date" className="flex items-center gap-2 font-medium text-green-700">
                <Calendar className="h-4 w-4" />
                Expected Harvest Date
              </Label>
              <Input
                id="expected_harvest_date"
                type="date"
                value={formData.expected_harvest_date}
                onChange={(e) => handleInputChange('expected_harvest_date', e.target.value)}
                className="border-green-200 focus:border-green-400"
              />
            </div>
          </div>

          {/* Irrigation Type */}
          <div className="space-y-2">
            <Label htmlFor="irrigation_type" className="flex items-center gap-2 font-medium text-green-700">
              <Droplets className="h-4 w-4" />
              Irrigation Type
            </Label>
            <Select onValueChange={(value) => handleInputChange('irrigation_type', value)}>
              <SelectTrigger className="border-green-200 focus:border-green-400">
                <SelectValue placeholder="Select irrigation method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="drip">Drip Irrigation</SelectItem>
                <SelectItem value="sprinkler">Sprinkler</SelectItem>
                <SelectItem value="flood">Flood Irrigation</SelectItem>
                <SelectItem value="rainfed">Rain-fed</SelectItem>
                <SelectItem value="manual">Manual Watering</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fertilizer Details */}
          <div className="space-y-2">
            <Label htmlFor="fertilizer_details" className="flex items-center gap-2 font-medium text-green-700">
              <Sparkles className="h-4 w-4" />
              Fertilizer Details
            </Label>
            <Textarea
              id="fertilizer_details"
              value={formData.fertilizer_details}
              onChange={(e) => handleInputChange('fertilizer_details', e.target.value)}
              placeholder="e.g., NPK 10:26:26, Organic compost, Urea application schedule..."
              rows={3}
              className="border-green-200 focus:border-green-400"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="font-medium text-green-700">
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional information about this crop..."
              rows={3}
              className="border-green-200 focus:border-green-400"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || !formData.crop_name}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 transition-all duration-200"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Adding Crop...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Crop
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddCrop;
