'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, CameraOff, Zap, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function CameraWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Open camera and start streaming
  const openCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera on mobile if available
        },
        audio: false
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
        setIsOpen(true);
      }
    } catch (err) {
      let errorMessage = 'Camera access denied or not available';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and try again.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (err.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported on this browser.';
        }
      }
      
      setError(errorMessage);
      console.error('Camera error:', err);
    }
  }, []);

  // Close camera and stop streaming
  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
    setIsOpen(false);
    setError(null);
  }, []);

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !isStreaming) return;

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to base64 image
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageDataUrl);
    }
  }, [isStreaming]);

  // Clean up on component unmount
  React.useEffect(() => {
    return () => {
      closeCamera();
    };
  }, [closeCamera]);

  return (
    <div id="camera-widget" className="w-full max-w-2xl mx-auto">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          {/* Error Display */}
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Initial Open Camera Button */}
          {!isOpen && !error && (
            <div className="text-center py-8">
              <Button
                onClick={openCamera}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                <Camera className="mr-2 h-5 w-5" />
                Open Camera
              </Button>
            </div>
          )}

          {/* Camera Stream Interface */}
          {isOpen && (
            <div className="space-y-4">
              {/* Video Stream */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-auto max-h-96 object-cover"
                  playsInline
                  muted
                  style={{ transform: 'scaleX(-1)' }} // Mirror effect for selfie mode
                />
                
                {/* Loading overlay while camera starts */}
                {!isStreaming && (
                  <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Camera className="mx-auto h-12 w-12 mb-2 animate-pulse" />
                      <p>Starting camera...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              {isStreaming && (
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button
                    onClick={capturePhoto}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1 max-w-xs"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Capture Photo
                  </Button>
                  
                  <Button
                    onClick={closeCamera}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50 flex-1 max-w-xs"
                  >
                    <CameraOff className="mr-2 h-4 w-4" />
                    Close Camera
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Captured Photo Display */}
          {capturedImage && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold mb-3 text-center text-gray-800">
                Captured Photo
              </h3>
              <div className="bg-gray-100 rounded-lg p-4">
                <img
                  src={capturedImage}
                  alt="Captured from camera"
                  className="w-full h-auto max-h-64 object-contain rounded-md mx-auto"
                />
                
                {/* Photo Actions */}
                <div className="flex gap-2 justify-center mt-4">
                  <Button
                    onClick={capturePhoto}
                    size="sm"
                    variant="outline"
                    disabled={!isStreaming}
                  >
                    Retake Photo
                  </Button>
                  
                  <Button
                    onClick={() => setCapturedImage(null)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Remove Photo
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 text-sm text-gray-600 text-center">
            <p>
              {!isOpen && !error && "Click 'Open Camera' to start taking photos"}
              {isOpen && !isStreaming && "Camera is starting..."}
              {isStreaming && !capturedImage && "Position your subject and click 'Capture Photo'"}
              {capturedImage && "Photo captured! You can retake or use this image."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
