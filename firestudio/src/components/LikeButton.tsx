'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';

interface LikeButtonProps {
  messageId: string;
  initialLikeCount: number;
  initialIsLiked?: boolean;
  onToggleLike: (messageId: string) => Promise<{ liked: boolean; likeCount: number }>;
  disabled?: boolean;
}

export function LikeButton({ 
  messageId, 
  initialLikeCount, 
  initialIsLiked = false,
  onToggleLike,
  disabled = false
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const handleToggleLike = useCallback(async () => {
    if (isLoading || disabled) return;
    
    setIsLoading(true);
    
    // Optimistic update
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;
    
    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);
    
    try {
      const result = await onToggleLike(messageId);
      
      // Update with actual values from server
      setIsLiked(result.liked);
      setLikeCount(result.likeCount);
      
    } catch (error) {
      console.error('Error toggling like:', error);
      
      // Revert optimistic update on error
      setIsLiked(isLiked);
      setLikeCount(likeCount);
    } finally {
      setIsLoading(false);
    }
  }, [messageId, isLiked, likeCount, isLoading, disabled, onToggleLike]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggleLike}
      disabled={isLoading || disabled}
      title={isLiked ? (t.unlike || 'Unlike') : (t.like || 'Like')}
      aria-label={`${isLiked ? (t.unlike || 'Unlike') : (t.like || 'Like')} - ${likeCount} ${t.likes || 'likes'}`}
      className={cn(
        "flex items-center gap-1 h-8 px-2 text-xs transition-all duration-200",
        isLiked 
          ? "text-red-600 bg-red-50 hover:bg-red-100" 
          : "text-gray-500 hover:text-red-600 hover:bg-red-50",
        isLoading && "opacity-50 cursor-not-allowed"
      )}
    >
      <Heart 
        className={cn(
          "h-4 w-4 transition-all duration-200",
          isLiked ? "fill-current text-red-600" : "text-gray-400",
          isLoading && "animate-pulse"
        )} 
      />
      <span className="font-medium">
        {likeCount}
      </span>
    </Button>
  );
}
