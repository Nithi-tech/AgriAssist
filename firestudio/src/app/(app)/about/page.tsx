// app/(app)/about/page.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, Users, Globe, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-green-800 mb-4">About AgriAssist</h1>
          <p className="text-xl text-gray-600">Empowering farmers with AI-powered agricultural solutions</p>
        </div>

        {/* Mission Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-green-600" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              AgriAssist is dedicated to revolutionizing agriculture through cutting-edge technology. 
              We provide farmers with intelligent tools, real-time monitoring, and data-driven insights 
              to optimize crop yields, reduce costs, and promote sustainable farming practices.
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Smart Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Real-time sensor data collection for soil health, weather conditions, and crop status monitoring.
              </p>
              <div className="flex gap-2 mt-3">
                <Badge variant="outline">IoT Sensors</Badge>
                <Badge variant="outline">Real-time Data</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                AI-Powered Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Machine learning algorithms provide crop recommendations, disease detection, and yield predictions.
              </p>
              <div className="flex gap-2 mt-3">
                <Badge variant="outline">Machine Learning</Badge>
                <Badge variant="outline">Predictions</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-orange-600" />
              Our Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Built by passionate developers and agricultural experts committed to transforming farming through technology.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge>Agricultural Technology</Badge>
              <Badge>IoT Development</Badge>
              <Badge>AI/ML Engineering</Badge>
              <Badge>Sustainable Farming</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
