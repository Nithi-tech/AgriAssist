'use client';

import { useRef, useState, useEffect, useCallback } from "react";
import { Camera, RefreshCw, CheckCircle, X, AlertTriangle, Zap, Trash2, Upload } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";

interface ModernCameraProps {
  onCapture: (imageDataUrl: string) => void;
  onClose?: () => void;
  className?: string;
  allowFileUpload?: boolean;
}

export function ModernCamera({ onCapture, onClose, className = "", allowFileUpload = true }: ModernCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Stop any existing stream
      stopCamera();

      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: facingMode,
        },
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = newStream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
        setStream(newStream);
      }
    } catch (err) {
      let errorMessage = 'Unable to access camera';
      
      if (err instanceof Error) {
        switch (err.name) {
          case 'NotAllowedError':
            errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
            break;
          case 'NotFoundError':
            errorMessage = 'No camera found on this device.';
            break;
          case 'NotSupportedError':
            errorMessage = 'Camera not supported in this browser.';
            break;
          case 'NotReadableError':
            errorMessage = 'Camera is being used by another application.';
            break;
          default:
            errorMessage = `Camera error: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      console.error('Camera error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, stopCamera]);

  const takePicture = useCallback(() => {
    if (!videoRef.current || !stream) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCaptured(dataUrl);
    
    // Stop the camera after capture
    stopCamera();
  }, [stream, stopCamera]);

  const retake = useCallback(async () => {
    setIsTransitioning(true);
    setCaptured(null);
    
    // Add a small delay for smooth transition
    setTimeout(() => {
      startCamera();
      setIsTransitioning(false);
    }, 300);
  }, [startCamera]);

  const removeImage = useCallback(async () => {
    setIsTransitioning(true);
    setCaptured(null);
    
    // Add a small delay for smooth transition
    setTimeout(() => {
      startCamera();
      setIsTransitioning(false);
    }, 300);
  }, [startCamera]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIsTransitioning(true);
        stopCamera();
        
        setTimeout(() => {
          setCaptured(reader.result as string);
          setIsTransitioning(false);
        }, 300);
      };
      reader.readAsDataURL(file);
    }
  }, [stopCamera]);

  const usePhoto = useCallback(() => {
    if (captured) {
      onCapture(captured);
      setCaptured(null);
    }
  }, [captured, onCapture]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (stream) {
      startCamera();
    }
  }, [facingMode]);

  const handleClose = useCallback(() => {
    stopCamera();
    setCaptured(null);
    onClose?.();
  }, [stopCamera, onClose]);

  if (error) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Error</h3>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={startCamera} 
                className="flex-1"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              {onClose && (
                <Button onClick={handleClose} variant="ghost">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 transition-all duration-300 ${className}`}>
      <Card className={`w-full max-w-lg mx-auto bg-white shadow-2xl transform transition-all duration-300 ${isTransitioning ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}>
        <CardContent className="p-0">
          <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-50 to-blue-50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Camera className="w-5 h-5 text-green-600" />
                Camera Capture
              </h3>
              <div className="flex items-center gap-2">
                {/* Camera Switch Button (only show if multiple cameras likely available) */}
                {!captured && stream && (
                  <Button
                    onClick={switchCamera}
                    size="sm"
                    variant="outline"
                    className="text-xs hover:bg-blue-50"
                    title="Switch Camera"
                  >
                    {facingMode === 'user' ? '📷' : '🔄'}
                  </Button>
                )}
                {onClose && (
                  <Button onClick={handleClose} size="sm" variant="ghost">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Camera Content */}
            <div className="aspect-[4/3] bg-black relative overflow-hidden">
              {!captured ? (
                <>
                  {/* Video Stream */}
                  <video
                    ref={videoRef}
                    className={`w-full h-full object-cover transition-all duration-300 ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}
                    playsInline
                    muted
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                  />
                  
                  {/* Loading Overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-center space-y-3">
                        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-sm">Starting camera...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Camera Controls Overlay */}
                  {stream && !isLoading && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                      <div className="flex justify-center items-center gap-4">
                        {/* File Upload Button */}
                        {allowFileUpload && (
                          <label className="cursor-pointer">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="hidden"
                              aria-label="Upload image from device"
                            />
                            <Button
                              type="button"
                              size="lg"
                              className="w-12 h-12 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg transition-all duration-200 hover:scale-110"
                              aria-label="Upload image from device"
                            >
                              <Upload className="w-5 h-5" />
                            </Button>
                          </label>
                        )}
                        
                        {/* Take Picture Button */}
                        <Button
                          onClick={takePicture}
                          size="lg"
                          className="w-16 h-16 rounded-full bg-white text-gray-900 hover:bg-gray-100 shadow-lg transition-all duration-200 hover:scale-110 border-4 border-white"
                          aria-label="Take picture"
                        >
                          <Camera className="w-6 h-6" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Captured Image Preview */
                <div className={`w-full h-full flex items-center justify-center bg-gray-100 transition-all duration-300 ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
                  <img
                    src={captured}
                    alt="Captured image preview"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            {captured && (
              <div className={`p-4 bg-gradient-to-r from-gray-50 to-blue-50 border-t transition-all duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {/* Remove Image Button */}
                  <Button
                    onClick={removeImage}
                    variant="outline"
                    className="flex items-center justify-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 transition-all duration-200 hover:scale-105 w-full sm:w-auto"
                    aria-label="Remove image and restart camera"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </Button>
                  
                  {/* Retake Button */}
                  <Button
                    onClick={retake}
                    variant="outline"
                    className="flex items-center justify-center gap-2 bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-300 transition-all duration-200 hover:scale-105 w-full sm:w-auto"
                    aria-label="Retake photo"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retake
                  </Button>
                  
                  {/* Use Photo Button */}
                  <Button
                    onClick={usePhoto}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 transition-all duration-200 hover:scale-105 shadow-lg w-full sm:w-auto"
                    aria-label="Use this photo"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Use Photo
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Hidden Canvas for Image Capture */}
      <canvas
        ref={canvasRef}
        className="hidden"
        width={640}
        height={480}
      />
    </div>
  );
}
