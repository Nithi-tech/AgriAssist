/**
 * Fertilizer Recommendations Page
 * Full-featured page for viewing and managing fertilizer recommendations
 */

'use client';

import React, { useState } from 'react';
import FertilizerRecommendations from '@/components/FertilizerRecommendations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useManualNutrientCheck } from '@/hooks/useFertilizerRecommendations';
import { AlertMessage } from '@/lib/fertilizer-recommendations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Leaf, 
  Calculator, 
  Settings,
  AlertTriangle,
  AlertCircle,
  Info
} from 'lucide-react';

const FertilizerRecommendationsPage: React.FC = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [pollInterval, setPollInterval] = useState<number>(30000);
  
  // Manual nutrient checking
  const [manualN, setManualN] = useState<string>('');
  const [manualP, setManualP] = useState<string>('');
  const [manualK, setManualK] = useState<string>('');
  const [manualAlerts, setManualAlerts] = useState<AlertMessage[]>([]);
  
  const { checkNutrients, loading: manualLoading, error: manualError } = useManualNutrientCheck();

  const handleManualCheck = async () => {
    const n = parseFloat(manualN);
    const p = parseFloat(manualP);
    const k = parseFloat(manualK);

    if (isNaN(n) || isNaN(p) || isNaN(k)) {
      alert('Please enter valid numbers for all nutrient values');
      return;
    }

    const alerts = await checkNutrients(n, p, k);
    setManualAlerts(alerts);
  };

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

  // Mock device and crop options (in real app, fetch from API)
  const deviceOptions = [
    { id: '', label: 'All Devices' },
    { id: 'ESP32_001', label: 'ESP32_001 - Field A' },
    { id: 'ESP32_002', label: 'ESP32_002 - Field B' },
    { id: 'ESP32_003', label: 'ESP32_003 - Greenhouse' },
  ];

  const cropOptions = [
    { id: '', label: 'All Crops' },
    { id: '1', label: 'Wheat' },
    { id: '2', label: 'Rice' },
    { id: '3', label: 'Corn' },
    { id: '4', label: 'Tomatoes' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center space-x-2 mb-2">
          <Leaf className="h-8 w-8 text-green-600" />
          <span>Fertilizer Recommendations</span>
        </h1>
        <p className="text-gray-600">
          Monitor soil nutrient levels and get real-time fertilizer recommendations for optimal crop growth.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Recommendations - Takes up 2 columns */}
        <div className="lg:col-span-2">
          <FertilizerRecommendations
            deviceId={selectedDeviceId || undefined}
            cropId={selectedCropId || undefined}
            pollInterval={pollInterval}
            showTrends={true}
            showLatestReading={true}
          />
        </div>

        {/* Sidebar - Settings and Manual Check */}
        <div className="space-y-6">
          {/* Filters and Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="device-select">Device</Label>
                <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                  <SelectTrigger id="device-select">
                    <SelectValue placeholder="Select device" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceOptions.map(option => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="crop-select">Crop</Label>
                <Select value={selectedCropId} onValueChange={setSelectedCropId}>
                  <SelectTrigger id="crop-select">
                    <SelectValue placeholder="Select crop" />
                  </SelectTrigger>
                  <SelectContent>
                    {cropOptions.map(option => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="interval-select">Update Interval</Label>
                <Select 
                  value={pollInterval.toString()} 
                  onValueChange={(value) => setPollInterval(parseInt(value))}
                >
                  <SelectTrigger id="interval-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15000">15 seconds</SelectItem>
                    <SelectItem value="30000">30 seconds</SelectItem>
                    <SelectItem value="60000">1 minute</SelectItem>
                    <SelectItem value="300000">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Manual Nutrient Check */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Manual Check</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nitrogen">Nitrogen (N) - ppm</Label>
                <Input
                  id="nitrogen"
                  type="number"
                  placeholder="e.g., 25"
                  value={manualN}
                  onChange={(e) => setManualN(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="phosphorus">Phosphorus (P) - ppm</Label>
                <Input
                  id="phosphorus"
                  type="number"
                  placeholder="e.g., 18"
                  value={manualP}
                  onChange={(e) => setManualP(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="potassium">Potassium (K) - ppm</Label>
                <Input
                  id="potassium"
                  type="number"
                  placeholder="e.g., 150"
                  value={manualK}
                  onChange={(e) => setManualK(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleManualCheck} 
                className="w-full"
                disabled={manualLoading || !manualN || !manualP || !manualK}
              >
                {manualLoading ? 'Checking...' : 'Check Nutrients'}
              </Button>

              {manualError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{manualError}</AlertDescription>
                </Alert>
              )}

              {/* Manual Check Results */}
              {manualAlerts.length > 0 && (
                <div className="space-y-2 border-t pt-4">
                  <h4 className="font-medium text-sm">Results:</h4>
                  {manualAlerts.map((alert, index) => (
                    <Alert key={index} className="p-3">
                      <div className="flex items-start space-x-2">
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{alert.nutrient}</span>
                            <Badge variant={getSeverityColor(alert.severity) as any} className="text-xs">
                              {alert.value} ppm
                            </Badge>
                          </div>
                          <AlertDescription className="text-xs">
                            {alert.message}
                          </AlertDescription>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {alert.fertilizers.map(fertilizer => (
                              <Badge key={fertilizer} variant="outline" className="text-xs px-1 py-0">
                                {fertilizer}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}

              {manualAlerts.length === 0 && manualN && manualP && manualK && !manualLoading && !manualError && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    All nutrient levels are optimal. No fertilization needed.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Nutrient Reference Ranges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Alert Ranges</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div>
                <span className="font-medium">Nitrogen (N):</span> 20-50 ppm
                <br />
                <span className="text-gray-500">Urea, Ammonium Nitrate</span>
              </div>
              <div>
                <span className="font-medium">Phosphorus (P):</span> 15-30 ppm
                <br />
                <span className="text-gray-500">Superphosphates, MAP, DAP</span>
              </div>
              <div>
                <span className="font-medium">Potassium (K):</span> 100-200 ppm
                <br />
                <span className="text-gray-500">KCl, K₂SO₄, KNO₃</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FertilizerRecommendationsPage;
