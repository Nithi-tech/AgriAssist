'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Trash2, 
  Send,
  Volume2,
  Square
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceMessageRecorderProps {
  onSendVoiceMessage: (audioBlob: Blob, duration: number) => void;
  disabled?: boolean;
  maxDuration?: number; // in seconds
  className?: string;
}

interface VoiceMessagePlayerProps {
  audioUrl: string;
  duration: number;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioUrl?: string;
  audioBlob?: Blob;
}

export function VoiceMessageRecorder({
  onSendVoiceMessage,
  disabled = false,
  maxDuration = 120, // 2 minutes default
  className
}: VoiceMessageRecorderProps) {
  const { toast } = useToast();
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRecording();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Update playback progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setPlaybackProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setPlaybackProgress(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [recordingState.audioUrl]);

  const cleanupRecording = useCallback(() => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }

    audioChunksRef.current = [];
  }, []);

  const startRecording = useCallback(async () => {
    if (disabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      // Create MediaRecorder with optimal settings
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setRecordingState(prev => ({
          ...prev,
          isRecording: false,
          audioUrl,
          audioBlob
        }));
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast({
          title: "Recording error",
          description: "An error occurred while recording. Please try again.",
          variant: "destructive",
        });
        stopRecording();
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every 1000ms

      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        duration: 0
      }));

      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingState(prev => {
          const newDuration = prev.duration + 1;
          
          // Auto-stop at max duration
          if (newDuration >= maxDuration) {
            stopRecording();
            return prev;
          }
          
          return {
            ...prev,
            duration: newDuration
          };
        });
      }, 1000);

      toast({
        title: "Recording started",
        description: `Recording voice message... (Max ${maxDuration}s)`,
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [disabled, maxDuration, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    toast({
      title: "Recording completed",
      description: `Voice message recorded (${recordingState.duration}s)`,
    });
  }, [recordingState.isRecording, recordingState.duration, toast]);

  const playRecording = useCallback(() => {
    if (!recordingState.audioUrl) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      } else {
        audioRef.current = new Audio(recordingState.audioUrl);
      }

      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(error => {
          console.error('Error playing audio:', error);
          toast({
            title: "Playback failed",
            description: "Could not play the recorded message.",
            variant: "destructive",
          });
        });
    }
  }, [recordingState.audioUrl, isPlaying, toast]);

  const deleteRecording = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (recordingState.audioUrl) {
      URL.revokeObjectURL(recordingState.audioUrl);
    }

    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0
    });
    setIsPlaying(false);
    setPlaybackProgress(0);

    toast({
      title: "Recording deleted",
      description: "Voice message has been deleted.",
    });
  }, [recordingState.audioUrl, toast]);

  const sendRecording = useCallback(() => {
    if (!recordingState.audioBlob) return;

    onSendVoiceMessage(recordingState.audioBlob, recordingState.duration);
    
    // Clean up after sending
    deleteRecording();
    
    toast({
      title: "Voice message sent",
      description: "Your voice message has been sent to the community.",
    });
  }, [recordingState.audioBlob, recordingState.duration, onSendVoiceMessage, deleteRecording, toast]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Recording Controls */}
      <div className="flex items-center gap-2">
        {!recordingState.isRecording && !recordingState.audioUrl ? (
          // Start Recording Button
          <Button
            variant="ghost"
            size="icon"
            onClick={startRecording}
            disabled={disabled}
            className="h-10 w-10 rounded-full bg-green-100 hover:bg-green-200 text-green-600"
          >
            <Mic className="h-5 w-5" />
          </Button>
        ) : recordingState.isRecording ? (
          // Recording in Progress
          <div className="flex items-center gap-3 bg-red-50 p-2 rounded-lg border border-red-200">
            <Button
              variant="destructive"
              size="icon"
              onClick={stopRecording}
              className="h-8 w-8 rounded-full animate-pulse"
            >
              <Square className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">
                  Recording... {formatDuration(recordingState.duration)}
                </span>
              </div>
              <Progress 
                value={(recordingState.duration / maxDuration) * 100} 
                className="h-1 mt-1"
              />
            </div>
          </div>
        ) : (
          // Recorded Audio Controls
          <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-200">
            <Button
              variant="ghost"
              size="icon"
              onClick={playRecording}
              className="h-8 w-8 rounded-full bg-blue-600 text-white hover:bg-blue-700"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">
                  Voice Message ({formatDuration(recordingState.duration)})
                </span>
              </div>
              {isPlaying && (
                <Progress 
                  value={playbackProgress} 
                  className="h-1 mt-1"
                />
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={deleteRecording}
              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={sendRecording}
              className="h-8 w-8 bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Recording Tips */}
      {recordingState.isRecording && (
        <div className="text-xs text-gray-500 text-center">
          Tap the stop button when finished • Max {maxDuration}s
        </div>
      )}

      {recordingState.audioUrl && (
        <div className="text-xs text-gray-500 text-center">
          Preview your message and tap send to share with the community
        </div>
      )}
    </div>
  );
}

export function VoiceMessagePlayer({
  audioUrl,
  duration,
  onPlay,
  onPause,
  className
}: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });

      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
        onPause?.();
      });
    }
  }, [onPause]);

  const handlePlayPause = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      onPause?.();
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      onPlay?.();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("flex items-center gap-2 p-2 bg-blue-50 rounded-lg", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePlayPause}
        className="h-8 w-8 rounded-full bg-blue-600 text-white hover:bg-blue-700"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">
            Voice Message ({formatTime(currentTime)} / {formatTime(duration)})
          </span>
        </div>
        {isPlaying && (
          <Progress 
            value={(currentTime / duration) * 100} 
            className="h-1 mt-1"
          />
        )}
      </div>
    </div>
  );
}
