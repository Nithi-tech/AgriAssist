'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  audioUrl: string;
  duration?: number; // in seconds
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  autoHeight?: boolean;
  showDuration?: boolean;
}

export function AudioPlayer({
  audioUrl,
  duration = 0,
  className,
  onPlay,
  onPause,
  onEnded,
  autoHeight = true,
  showDuration = true
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
      setIsLoading(false);
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };
    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };
    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };
    const handleError = (e: any) => {
      console.error('Audio playback error:', e);
      setError('Failed to load audio');
      setIsLoading(false);
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [onPlay, onPause, onEnded]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (error) {
      console.error('Playback error:', error);
      setError('Playback failed');
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !value.length) return;

    const newTime = (value[0] / 100) * audioDuration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  if (error) {
    return (
      <div className={cn(
        'flex items-center gap-2 p-2 rounded-lg bg-red-50 text-red-600',
        className
      )}>
        <VolumeX className="w-4 h-4" />
        <span className="text-sm">Audio unavailable</span>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200',
      autoHeight && 'min-h-[60px]',
      className
    )}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        className="hidden"
      />

      {/* Play/Pause button */}
      <Button
        variant="outline"
        size="sm"
        className="w-8 h-8 rounded-full p-0 shrink-0"
        onClick={togglePlayPause}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="w-3 h-3 border-2 border-current border-t-transparent animate-spin rounded-full" />
        ) : isPlaying ? (
          <Pause className="w-3 h-3" />
        ) : (
          <Play className="w-3 h-3 ml-0.5" />
        )}
      </Button>

      {/* Progress bar */}
      <div className="flex-1 min-w-0">
        <Slider
          value={[progress]}
          onValueChange={handleSeek}
          max={100}
          step={1}
          className="w-full"
          disabled={isLoading || audioDuration === 0}
        />
      </div>

      {/* Time display */}
      {showDuration && (
        <div className="text-xs text-gray-500 font-mono shrink-0 min-w-[60px] text-right">
          {formatTime(currentTime)} / {formatTime(audioDuration)}
        </div>
      )}

      {/* Mute button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-6 h-6 p-0 shrink-0"
        onClick={toggleMute}
        disabled={isLoading}
      >
        {isMuted ? (
          <VolumeX className="w-3 h-3" />
        ) : (
          <Volume2 className="w-3 h-3" />
        )}
      </Button>
    </div>
  );
}
