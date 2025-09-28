'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Copy, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TeamMemberCard = ({ name, role, phone, avatar }) => {
  const { toast } = useToast();

  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: '📋 Copied!',
        description: `${label} copied to clipboard`,
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: '❌ Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleCall = (phoneNumber) => {
    window.open(`tel:${phoneNumber}`);
    toast({
      title: '📞 Calling...',
      description: `Initiating call to ${name}`,
      duration: 2000,
    });
  };

  const handleWhatsApp = (phoneNumber) => {
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`);
    toast({
      title: '💬 WhatsApp',
      description: `Opening WhatsApp chat with ${name}`,
      duration: 2000,
    });
  };

  // Generate initials from name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="group hover:scale-105 hover:shadow-2xl transition-all duration-300 bg-white border-0 shadow-lg">
      <CardContent className="p-6 text-center">
        {/* Avatar */}
        <div className="relative mb-4">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-16 h-16 rounded-full mx-auto object-cover border-4 border-green-100 group-hover:border-green-200 transition-all duration-300"
            />
          ) : (
            <div className="w-16 h-16 rounded-full mx-auto bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg border-4 border-green-100 group-hover:border-green-200 transition-all duration-300">
              {getInitials(name)}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 group-hover:bg-green-600 transition-colors duration-300">
            <User className="h-3 w-3" />
          </div>
        </div>

        {/* Name & Role */}
        <div className="mb-4">
          <h3 className="font-bold text-lg text-gray-900 group-hover:text-green-700 transition-colors duration-300">
            {name}
          </h3>
          <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
            {role}
          </p>
        </div>

        {/* Phone Number */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg group-hover:bg-green-50 transition-colors duration-300">
          <p className="text-sm font-mono text-gray-700 group-hover:text-green-700 transition-colors duration-300">
            📱 {phone}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300 hover:scale-105 transition-all duration-200"
            onClick={() => handleCopy(phone, 'Phone number')}
          >
            <Copy className="h-4 w-4 mr-1" />
            📋
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300 hover:scale-105 transition-all duration-200"
            onClick={() => handleCall(phone)}
          >
            <Phone className="h-4 w-4 mr-1" />
            📞
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 hover:border-emerald-300 hover:scale-105 transition-all duration-200"
            onClick={() => handleWhatsApp(phone)}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            💬
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamMemberCard;
