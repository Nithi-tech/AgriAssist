'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Database, 
  Activity, 
  Settings,
  Eye,
  Trash2,
  Search,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Lock
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalCrops: number;
  totalMessages: number;
  systemHealth: 'good' | 'warning' | 'error';
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'farmer' | 'admin' | 'expert';
  status: 'active' | 'inactive';
  lastLogin: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 1250,
    totalCrops: 850,
    totalMessages: 3420,
    systemHealth: 'good'
  });
  
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'राम प्रसाद',
      email: 'ram@farmer.com',
      role: 'farmer',
      status: 'active',
      lastLogin: '2024-03-20 10:30'
    },
    {
      id: '2',
      name: 'Dr. प्रिया शर्मा',
      email: 'priya@expert.com',
      role: 'expert',
      status: 'active',
      lastLogin: '2024-03-20 09:15'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserAction = (userId: string, action: 'activate' | 'deactivate' | 'delete') => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: action === 'activate' ? 'active' : action === 'deactivate' ? 'inactive' : user.status }
        : user
    ).filter(user => !(action === 'delete' && user.id === userId)));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-gray-900 p-3 rounded-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-1">System management and oversight</p>
            </div>
          </div>
          
          <Alert className="border-amber-200 bg-amber-50">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Secure Access:</strong> This panel is restricted to authorized administrators only.
            </AlertDescription>
          </Alert>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="flex items-center p-6">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-gray-600">Total Users</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="flex items-center p-6">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <Database className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCrops.toLocaleString()}</p>
                <p className="text-gray-600">Crop Records</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="flex items-center p-6">
              <div className="bg-purple-100 p-3 rounded-lg mr-4">
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMessages.toLocaleString()}</p>
                <p className="text-gray-600">Messages</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="flex items-center p-6">
              <div className={`p-3 rounded-lg mr-4 ${
                stats.systemHealth === 'good' ? 'bg-green-100' : 
                stats.systemHealth === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                {stats.systemHealth === 'good' ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">System</p>
                <Badge className={
                  stats.systemHealth === 'good' ? 'bg-green-100 text-green-800' : 
                  stats.systemHealth === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }>
                  {stats.systemHealth === 'good' ? 'Healthy' : stats.systemHealth === 'warning' ? 'Warning' : 'Error'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Admin Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200">
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-100">Users</TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-gray-100">System</TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-gray-100">Data</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-100">Settings</TabsTrigger>
          </TabsList>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 text-gray-600 font-medium">User</th>
                        <th className="text-left py-3 text-gray-600 font-medium">Role</th>
                        <th className="text-left py-3 text-gray-600 font-medium">Status</th>
                        <th className="text-left py-3 text-gray-600 font-medium">Last Login</th>
                        <th className="text-left py-3 text-gray-600 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4">
                            <div>
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="py-4">
                            <Badge variant="outline" className={
                              user.role === 'admin' ? 'border-red-200 text-red-800' :
                              user.role === 'expert' ? 'border-blue-200 text-blue-800' :
                              'border-green-200 text-green-800'
                            }>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="py-4">
                            <Badge className={
                              user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }>
                              {user.status}
                            </Badge>
                          </td>
                          <td className="py-4 text-gray-600">{user.lastLogin}</td>
                          <td className="py-4">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleUserAction(user.id, user.status === 'active' ? 'deactivate' : 'activate')}
                              >
                                {user.status === 'active' ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleUserAction(user.id, 'delete')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Monitoring */}
          <TabsContent value="system" className="space-y-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
                <CardDescription>Monitor system performance and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900">Database</h3>
                    <p className="text-sm text-green-600">Online</p>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900">API Services</h3>
                    <p className="text-sm text-green-600">Running</p>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900">Storage</h3>
                    <p className="text-sm text-green-600">Available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management */}
          <TabsContent value="data" className="space-y-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
                <CardDescription>Export, import, and backup system data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Export Data</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Export User Data
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Export Crop Records
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Export System Logs
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Import Data</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Users
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Crop Data
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Schemes
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Configuration
                </CardTitle>
                <CardDescription>Configure system-wide settings and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">API Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Weather API Key</label>
                        <Input type="password" placeholder="••••••••••••••••" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Market Data API</label>
                        <Input type="password" placeholder="••••••••••••••••" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">System Limits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Users</label>
                        <Input type="number" defaultValue="10000" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Storage Limit (GB)</label>
                        <Input type="number" defaultValue="1000" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                      Save Configuration
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}