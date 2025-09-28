'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '@/providers/admin-auth-provider';
import { AdminLoginForm } from '@/components/admin-login-form';
import AddCrop from '@/components/AddCrop';
import CropsList from '@/components/CropsList';
import RecentSensorData from '@/components/RecentSensorData';
import { PageHeader } from '@/components/page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Unlock, AlertTriangle, Sprout, Database, BarChart } from 'lucide-react';

export default function MyCropPage() {
  const { isAdmin, adminUsername } = useAdminAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCropAdded = (newCrop: any) => {
    // Trigger refresh of crops list
    setRefreshKey(prev => prev + 1);
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="🔐 Admin Access Required"
          subtitle="Please log in with admin credentials to access crop management"
        />
        
        <div className="max-w-md mx-auto mt-8">
          <Card className="border-2 border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-2 text-red-800">
                <Lock className="h-5 w-5" />
                Authentication Required
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This page requires admin authentication. Please contact your administrator for access.
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <AdminLoginForm />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <PageHeader
        title="🌾 Crop Management Dashboard"
        subtitle={`Welcome back, ${adminUsername}! Manage your crops, sensors, and data here.`}
      />

      <Alert className="border-green-200 bg-green-50">
        <Unlock className="h-4 w-4" />
        <AlertDescription>
          <strong>Admin Access Granted:</strong> You can now manage crops and view sensor data.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="crops" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="crops" className="flex items-center gap-2">
            <Sprout className="h-4 w-4" />
            Crop Management
          </TabsTrigger>
          <TabsTrigger value="sensors" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Sensor Data
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crops" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New Crop */}
            <div>
              <AddCrop onCropAdded={handleCropAdded} />
            </div>
            
            {/* Crops List */}
            <div>
              <CropsList key={refreshKey} refreshTrigger={refreshKey} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sensors" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Recent Sensor Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  All Sensor Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecentSensorData deviceId="all" limit={20} />
              </CardContent>
            </Card>

            {/* Specific Device Data Example */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-600" />
                  Device ESP32-001 Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecentSensorData deviceId="ESP32-001" limit={10} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Sprout className="h-5 w-5" />
                  Total Crops
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  <CropsList refreshTrigger={refreshKey} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Database className="h-5 w-5" />
                  Active Sensors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">
                  Coming Soon
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <BarChart className="h-5 w-5" />
                  Data Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">
                  Coming Soon
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>📊 Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <BarChart className="h-4 w-4" />
                  <AlertDescription>
                    Analytics dashboard is under development. Features will include:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Sensor data trends and graphs</li>
                      <li>Crop growth analytics</li>
                      <li>Yield predictions</li>
                      <li>Environmental monitoring</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
