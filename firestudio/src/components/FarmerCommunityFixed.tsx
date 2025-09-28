'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Heart, MessageCircle, Users, TrendingUp, Send, Plus, AlertCircle, Loader2 } from 'lucide-react';
import ChatBox from './ChatBox';

interface Comment {
  id: number;
  author: string;
  text: string;
  timestamp: string;
}

interface Post {
  id: number;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  category: string;
  comments: Comment[];
}

interface CommunityStats {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  activeAuthors: number;
  lastActivity: string | null;
}

const FarmerCommunityFixed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simple loading simulation
    const timer = setTimeout(() => {
      setLoading(false);
      setPosts([
        {
          id: 1,
          author: "John Farmer",
          content: "Hello everyone! Welcome to our farmer community.",
          timestamp: "2 hours ago",
          likes: 5,
          category: "General",
          comments: []
        }
      ]);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading community...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4 text-center">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-red-800 font-medium">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Farmer Community
          </h1>
          <p className="text-gray-600">
            Connect with fellow farmers, share experiences, and learn together.
          </p>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 mb-2" />
                <div className="ml-3">
                  <p className="text-2xl font-bold">{posts.length}</p>
                  <p className="text-blue-100">Total Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Heart className="h-8 w-8 mb-2" />
                <div className="ml-3">
                  <p className="text-2xl font-bold">
                    {posts.reduce((sum, post) => sum + post.likes, 0)}
                  </p>
                  <p className="text-green-100">Total Likes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center">
                <MessageCircle className="h-8 w-8 mb-2" />
                <div className="ml-3">
                  <p className="text-2xl font-bold">
                    {posts.reduce((sum, post) => sum + post.comments.length, 0)}
                  </p>
                  <p className="text-purple-100">Comments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 mb-2" />
                <div className="ml-3">
                  <p className="text-2xl font-bold">
                    {new Set(posts.map(post => post.author)).size}
                  </p>
                  <p className="text-orange-100">Active Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts */}
        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {post.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{post.author}</p>
                      <p className="text-sm text-gray-500">{post.timestamp}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{post.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 mb-4">{post.content}</p>
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500">
                    <Heart className="h-4 w-4 mr-1" />
                    {post.likes}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {post.comments.length}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No posts message */}
        {posts.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-500">Be the first to start a conversation in the community!</p>
            </CardContent>
          </Card>
        )}

        {/* Community Chat Box */}
        <ChatBox />
      </div>
    </div>
  );
};

export default FarmerCommunityFixed;
