import React from 'react';
import { Heart } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

interface LikeButtonProps {
  messageId: string;
  isLiked: boolean;
  likeCount: number;
  onToggleLike: (messageId: string) => void;
  disabled?: boolean;
}

export default function LikeButton({ 
  messageId, 
  isLiked, 
  likeCount, 
  onToggleLike, 
  disabled 
}: LikeButtonProps) {
  const { t } = useLanguage();

  return (
    <button
      onClick={() => onToggleLike(messageId)}
      disabled={disabled}
      title={isLiked ? (t.unlike || 'Unlike') : (t.like || 'Like')}
      aria-label={`${isLiked ? (t.unlike || 'Unlike') : (t.like || 'Like')} - ${likeCount} ${t.likes || 'likes'}`}
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        transition-colors duration-200 hover:bg-gray-100 active:scale-95
        ${isLiked 
          ? 'text-red-600 bg-red-50 hover:bg-red-100' 
          : 'text-gray-500 hover:text-red-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <Heart 
        size={14} 
        className={`transition-all duration-200 ${
          isLiked ? 'fill-current text-red-600' : 'text-gray-400'
        }`} 
      />
      <span className="min-w-[1ch]">
        {likeCount}
      </span>
    </button>
  );
}
