'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '@/providers/admin-auth-provider';
import { AdminLoginForm } from '@/components/admin-login-form';
import AdminCropForm from '@/components/AdminCropForm';
import AllCropsList from '@/components/AllCropsList';
import RecentSensorData from '@/components/RecentSensorData';
import { PageHeader } from '@/components/page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Unlock, AlertTriangle, Sprout, Database, BarChart, Plus } from 'lucide-react';

export default function MyCropPage() {
  const { isAdmin, adminUsername } = useAdminAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  const handleCropAdded = () => {
    // Trigger refresh of crops list
    setRefreshKey(prev => prev + 1);
    // Switch to overview tab to see updated list
    setActiveTab('overview');
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
        title="🌾 Admin Crop Management"
        subtitle={`Welcome back, ${adminUsername}! Complete crop management dashboard.`}
      />

      <Alert className="border-green-200 bg-green-50">
        <Unlock className="h-4 w-4" />
        <AlertDescription>
          <strong>Admin Access Granted:</strong> Full access to crop management, sensor data, and analytics.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Sprout className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="add-crop" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Crop
          </TabsTrigger>
          <TabsTrigger value="sensors" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Sensors
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-green-600" />
                  All Crop Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AllCropsList key={refreshKey} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="add-crop" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                Add New Crop Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdminCropForm onCropAdded={handleCropAdded} />
            </CardContent>
          </Card>
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
                  Crop Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Analytics dashboard for crop performance tracking
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Database className="h-5 w-5" />
                  Sensor Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Real-time sensor data analysis
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <BarChart className="h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  System performance metrics
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>📊 Analytics Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <BarChart className="h-4 w-4" />
                  <AlertDescription>
                    Advanced analytics dashboard features:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Crop yield predictions and trends</li>
                      <li>Environmental monitoring and alerts</li>
                      <li>Resource optimization suggestions</li>
                      <li>Financial performance tracking</li>
                      <li>Disease and pest pattern analysis</li>
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
