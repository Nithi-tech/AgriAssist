'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send, Mic, MicOff, Square, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onSendVoiceMessage: (audioBlob: Blob, duration: number) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ 
  onSendMessage, 
  onSendVoiceMessage, 
  disabled = false, 
  placeholder = "Type your message..." 
}: ChatInputProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingStartTime = useRef<number>(0);

  // Handle text message send
  const handleSendText = useCallback(() => {
    if (!message.trim() || disabled) return;
    
    onSendMessage(message.trim());
    setMessage('');
  }, [message, disabled, onSendMessage]);

  // Handle Enter key
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  }, [handleSendText]);

  // Start voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTime.current = Date.now();
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        setAudioBlob(blob);
        setAudioUrl(url);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Update duration every 100ms
      recordingTimerRef.current = setInterval(() => {
        const elapsed = (Date.now() - recordingStartTime.current) / 1000;
        setRecordingDuration(elapsed);
        
        // Auto-stop at 60 seconds
        if (elapsed >= 60) {
          stopRecording();
        }
      }, 100);
      
      toast({
        title: "Recording started",
        description: "Speak your message. Tap stop when done.",
      });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Stop voice recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  }, [isRecording]);

  // Play recorded audio
  const playRecordedAudio = useCallback(() => {
    if (!audioUrl) return;
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        toast({
          title: "Playback failed",
          description: "Could not play the recorded audio.",
          variant: "destructive",
        });
      };
      
      audio.play();
      setIsPlaying(true);
    }
  }, [audioUrl, isPlaying, toast]);

  // Send voice message
  const handleSendVoice = useCallback(() => {
    if (!audioBlob) return;
    
    const duration = recordingDuration;
    onSendVoiceMessage(audioBlob, duration);
    
    // Reset voice recording state
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setIsPlaying(false);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [audioBlob, recordingDuration, onSendVoiceMessage]);

  // Cancel voice recording
  const cancelVoiceRecording = useCallback(() => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setIsPlaying(false);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If we have a recorded audio, show the voice message preview
  if (audioBlob && audioUrl) {
    return (
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={playRecordedAudio}
              className="shrink-0"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="text-sm text-gray-700">
              🎤 Voice message • {formatDuration(recordingDuration)}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={cancelVoiceRecording}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSendVoice} disabled={disabled}>
              <Send className="h-4 w-4 mr-1" />
              Send
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white shadow-lg">
      <div className="flex gap-3">
        {/* Voice recording button */}
        <Button
          size="sm"
          variant={isRecording ? "destructive" : "outline"}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          className={cn(
            "shrink-0 transition-all duration-200",
            isRecording && "animate-pulse"
          )}
        >
          {isRecording ? (
            <>
              <Square className="h-4 w-4 mr-1" />
              {formatDuration(recordingDuration)}
            </>
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>

        {/* Text input */}
        <div className="flex-1 relative">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isRecording ? "Recording... tap stop when done" : placeholder}
            disabled={disabled || isRecording}
            className="pr-12"
          />
          
          {/* Send button for text */}
          <Button
            size="sm"
            onClick={handleSendText}
            disabled={disabled || !message.trim() || isRecording}
            className="absolute right-1 top-1/2 transform -translate-y-1/2"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {isRecording && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-red-600">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            Recording • {formatDuration(recordingDuration)} / 1:00
          </div>
        </div>
      )}
    </Card>
  );
}
