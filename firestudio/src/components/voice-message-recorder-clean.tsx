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
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (recordedAudio) {
        URL.revokeObjectURL(recordedAudio);
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [recordedAudio]);

  const resetRecording = useCallback(() => {
    setIsRecording(false);
    setRecordedAudio(null);
    setRecordingTime(0);
    setIsPlaying(false);
    
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
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: "Could not start voice recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  }, [maxDuration, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isRecording]);

  const deleteRecording = useCallback(() => {
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio);
      setRecordedAudio(null);
    }
    resetRecording();
  }, [recordedAudio, resetRecording]);

  const sendRecording = useCallback(() => {
    if (recordedAudio && onSendVoiceMessage) {
      // Convert the audio URL to a file for sending
      fetch(recordedAudio)
        .then(response => response.blob())
        .then(blob => {
          onSendVoiceMessage(blob, recordingTime);
          deleteRecording();
        })
        .catch(error => {
          console.error('Error preparing voice message:', error);
          toast({
            title: "Send failed",
            description: "Could not prepare voice message for sending.",
            variant: "destructive",
          });
        });
    }
  }, [recordedAudio, onSendVoiceMessage, recordingTime, deleteRecording, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled) return;
      
      // Space bar to toggle recording (if not typing in an input)
      if (event.code === 'Space' && event.target === document.body) {
        event.preventDefault();
        if (isRecording) {
          stopRecording();
        } else if (!recordedAudio) {
          startRecording();
        }
      }
      
      // Escape to cancel/delete recording
      if (event.code === 'Escape') {
        if (recordedAudio) {
          deleteRecording();
        } else if (isRecording) {
          stopRecording();
        }
      }
      
      // Enter to send recording
      if (event.code === 'Enter' && recordedAudio && !event.shiftKey) {
        sendRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, recordedAudio, disabled, startRecording, stopRecording, deleteRecording, sendRecording]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "flex flex-col gap-2 p-3 border rounded-lg bg-background",
      className
    )}>
      {/* Recording Controls */}
      <div className="flex items-center justify-center gap-2">
        {!isRecording && !recordedAudio && (
          <Button
            variant="default"
            size="sm"
            onClick={startRecording}
            disabled={disabled}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
          >
            <Mic className="h-4 w-4" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-red-600">
              <div className="h-2 w-2 bg-red-600 rounded-full animate-pulse" />
              <span className="text-sm font-mono">
                {formatTime(recordingTime)}
              </span>
              <span className="text-xs text-gray-500">
                / {formatTime(maxDuration)}
              </span>
            </div>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={stopRecording}
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop
            </Button>
          </div>
        )}

        {recordedAudio && (
          <div className="flex items-center gap-2 w-full">
            <audio
              controls
              src={recordedAudio}
              className="flex-1 h-8"
              preload="metadata"
            />
            
            <Button
              variant="destructive"
              size="icon"
              onClick={deleteRecording}
              className="h-8 w-8"
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
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        onPause?.();
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };
      
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        onPause?.();
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        onPause?.();
        toast({
          title: "Playback failed",
          description: "Could not play voice message.",
          variant: "destructive",
        });
      };
      
      audio.play().then(() => {
        setIsPlaying(true);
        onPlay?.();
      }).catch(error => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
        toast({
          title: "Playback failed",
          description: "Could not play voice message.",
          variant: "destructive",
        });
      });
    }
  }, [audioUrl, isPlaying, onPlay, onPause, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-3 py-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePlayback}
        className="h-8 w-8 p-0 rounded-full bg-blue-600 text-white hover:bg-blue-700"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-blue-600" />
          <div className="h-2 bg-blue-200 rounded-full flex-1">
            <div 
              className="h-2 bg-blue-600 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-blue-600 font-medium">
            {isPlaying ? formatTime(currentTime) : formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
