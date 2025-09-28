'use client';

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { diagnoseLeafDisease, type DiagnoseLeafDiseaseOutput } from '@/ai/flows/disease-diagnosis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernCamera } from '@/components/ui/modern-camera';
import { useLanguage } from '@/hooks/use-language';
import Image from 'next/image';
import { 
  Loader2, 
  Upload, 
  Microscope, 
  Siren, 
  Volume2, 
  Cloud, 
  CheckCircle,
  Camera,
  Sparkles,
  Trash2,
  Zap,
  Shield,
  AlertTriangle,
  PlayCircle,
  Download,
  Share2,
  Eye,
  ScanLine,
  Stethoscope,
  Leaf,
  Bug,
  Droplets,
  Sun,
  Target,
  BookOpen,
  FileText,
  CheckCircle2,
  Clock,
  Lightbulb
} from 'lucide-react';
import { uploadImageToFirebase, type UploadResult } from '@/lib/firebase-upload';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export function DiseaseDiagnosisForm() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<DiagnoseLeafDiseaseOutput | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        // Removed auto-upload - no need to upload to Firebase for diagnosis
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUploadToFirebase = async (fileToUpload: File) => {
    if (!fileToUpload) return;

    setUploading(true);
    try {
      const result = await uploadImageToFirebase(fileToUpload, 'disease_diagnosis');
      setUploadResult(result);
      toast({
        title: "Upload successful",
        description: "Image has been uploaded to Firebase Storage",
        duration: 3000,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDiagnose = async () => {
    if (!file && !preview) {
      toast({
        title: "No image selected",
        description: "Please upload an image or take a photo first.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    console.log('Starting diagnosis...', { hasFile: !!file, hasPreview: !!preview });
    setLoading(true);
    setResult(null);

    try {
      // Show progress
      toast({
        title: "Analyzing image...",
        description: "Sending image to AI for disease analysis",
        duration: 2000,
      });

      const diagnosisResult = await diagnoseLeafDisease({ leafImageDataUri: preview! });
      console.log('Diagnosis completed:', diagnosisResult);
      
      setResult(diagnosisResult);
      
      toast({
        title: "Analysis complete",
        description: "Disease diagnosis has been generated successfully",
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error diagnosing disease:', error);
      
      let title = "Diagnosis failed";
      let description = "Failed to analyze the image. Please try again.";
      
      const errorMessage = error?.message || '';
      
      // Check for API configuration issues
      if (errorMessage.includes('API key') || errorMessage.includes('not configured') || errorMessage.includes('401') || errorMessage.includes('403')) {
        title = "API Configuration Required";
        description = "Please add your Google AI API key to the .env.local file. Check the API_SETUP_GUIDE.md for setup instructions.";
      } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        title = "API Limit Reached";
        description = "You have reached your API usage limit. Please check your API quota or try again later.";
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        title = "Network Error";
        description = "Please check your internet connection and try again.";
      } else if (errorMessage.includes('Invalid image data URI')) {
        title = "Invalid Image";
        description = "The image format is not supported. Please try a different image.";
      }
      
      toast({
        title,
        description: `Error: ${errorMessage}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCameraCapture = async (imageDataUrl: string) => {
    // Convert dataURL to file for potential upload
    try {
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      
      setFile(file);
      setPreview(imageDataUrl);
      setUploadResult(null);
      setShowCamera(false);

      // Removed auto-upload - no need to upload to Firebase for diagnosis
      
      toast({
        title: "Photo captured successfully",
        description: "Image is ready for disease diagnosis",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error processing captured image:', error);
      toast({
        title: "Processing failed",
        description: "Failed to process the captured image. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const removeImage = () => {
    setPreview(null);
    setFile(null);
    setUploadResult(null);
    setResult(null);
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    toast({
      title: "Image removed",
      description: "You can now upload a new image or use the camera",
      duration: 3000,
    });
  };

  return (
    <>
      {/* Modern Camera Modal */}
      {showCamera && (
        <ModernCamera
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
          allowFileUpload={true}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header Section */}
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-red-100 to-pink-100 px-6 py-3 rounded-full border border-red-200">
            <Stethoscope className="h-6 w-6 text-red-600" />
            <h1 className="text-2xl font-bold text-red-800">Plant Disease Diagnosis</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload or capture a photo of your plant to get instant AI-powered disease detection and treatment recommendations
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Enhanced Upload Section */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl text-emerald-800">
                  <Camera className="h-6 w-6" />
                  Plant Image Capture
                </CardTitle>
                <p className="text-emerald-700/80">Upload from gallery or take a photo with your camera</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {/* Enhanced Image Drop Zone */}
                <div 
                  className={`relative w-full h-80 border-2 border-dashed rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer group ${
                    preview 
                      ? 'border-emerald-300 bg-emerald-50' 
                      : 'border-emerald-300 bg-white hover:border-emerald-400 hover:bg-emerald-50/50'
                  }`}
                  onClick={() => !preview && fileInputRef.current?.click()}
                >
                  {preview ? (
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                      <Image 
                        src={preview} 
                        alt="Plant image for diagnosis" 
                        width={300} 
                        height={300} 
                        className="max-h-full w-auto object-contain rounded-xl shadow-lg" 
                      />
                      
                      {/* Overlay with actions */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-3">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage();
                            }}
                            size="sm"
                            variant="destructive"
                            className="rounded-full shadow-lg"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowCamera(true);
                            }}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg"
                          >
                            <Camera className="w-4 h-4 mr-1" />
                            Retake
                          </Button>
                        </div>
                      </div>
                      
                      {/* Scan animation overlay when analyzing */}
                      {loading && (
                        <div className="absolute inset-0 bg-blue-500/20 rounded-xl flex items-center justify-center">
                          <div className="relative">
                            <ScanLine className="h-12 w-12 text-blue-600 animate-pulse" />
                            <div className="absolute inset-0 animate-ping">
                              <ScanLine className="h-12 w-12 text-blue-400" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-shadow">
                        <Upload className="h-10 w-10 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xl font-semibold text-emerald-800">Drop your plant image here</p>
                        <p className="text-emerald-600 mt-1">or click to browse from gallery</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-emerald-600">
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                          <Leaf className="h-3 w-3 mr-1" />
                          JPG, PNG
                        </Badge>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                          <Target className="h-3 w-3 mr-1" />
                          Max 10MB
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Upload Status */}
                {uploading && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <Cloud className="h-4 w-4 text-blue-600 animate-bounce" />
                    <AlertDescription className="text-blue-800 font-medium">
                      <div className="flex items-center justify-between">
                        <span>Uploading to secure cloud storage...</span>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-200 rounded-full animate-pulse"></div>
                          <div className="w-4 h-4 bg-blue-200 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-4 h-4 bg-blue-200 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                {uploadResult && !uploading && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 font-medium">
                      Image uploaded successfully and ready for analysis
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Action Buttons */}
                {!preview ? (
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      onClick={() => fileInputRef.current?.click()} 
                      variant="outline" 
                      className="h-12 bg-white hover:bg-emerald-50 border-emerald-300 hover:border-emerald-400 text-emerald-700 hover:text-emerald-800 font-semibold"
                    >
                      <Upload className="mr-2 h-5 w-5" />
                      Upload Image
                    </Button>
                    
                    <Button 
                      onClick={() => setShowCamera(true)}
                      className="h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all font-semibold"
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      Open Camera
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {file && (
                      <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-emerald-200">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        <div className="flex-1">
                          <p className="font-medium text-emerald-800">{file.name}</p>
                          <p className="text-sm text-emerald-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700">Ready</Badge>
                      </div>
                    )}

                    {/* Enhanced Diagnose Button */}
                    <Button 
                      onClick={handleDiagnose} 
                      disabled={!preview || loading || uploading} 
                      className="w-full h-14 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                    >
                      {loading ? (
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <div className="absolute inset-0 animate-ping">
                              <Loader2 className="h-6 w-6 opacity-50" />
                            </div>
                          </div>
                          <span>AI Analyzing Plant...</span>
                        </div>
                      ) : uploading ? (
                        <div className="flex items-center gap-3">
                          <Cloud className="h-6 w-6 animate-pulse" />
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Zap className="h-6 w-6" />
                          <span>Start AI Diagnosis</span>
                        </div>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-yellow-800">
                  <Lightbulb className="h-5 w-5" />
                  Photography Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Sun className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Good Lighting</p>
                      <p className="text-sm text-yellow-700/80">Use natural daylight for best results</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Clear Focus</p>
                      <p className="text-sm text-yellow-700/80">Ensure the affected area is in sharp focus</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Close-up Shot</p>
                      <p className="text-sm text-yellow-700/80">Fill the frame with the diseased leaf or area</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Results Section */}
          <div className="xl:col-span-3 space-y-6">
            {loading && (
              <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-xl">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 bg-purple-200 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Microscope className="h-12 w-12 text-purple-600 animate-bounce" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-spin">
                        <Zap className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-4 max-w-md">
                    <h3 className="text-2xl font-bold text-purple-800">AI Analysis in Progress</h3>
                    <p className="text-purple-700">Our advanced AI is examining your plant image for disease patterns...</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-purple-600">
                        <span>Scanning for diseases</span>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between text-sm text-purple-600">
                        <span>Analyzing symptoms</span>
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                      <div className="flex items-center justify-between text-sm text-purple-400">
                        <span>Generating treatment plan</span>
                        <Clock className="h-4 w-4" />
                      </div>
                    </div>
                    
                    <Progress value={65} className="w-full h-3" />
                  </div>
                </CardContent>
              </Card>
            )}

            {result && (
              <div className="space-y-6">
                {/* Results Header */}
                <Card className="bg-gradient-to-r from-red-500 to-pink-600 text-white border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 p-3 rounded-full">
                        <AlertTriangle className="h-8 w-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Disease Detected</h2>
                        <p className="text-red-100">AI has identified the plant condition and treatment options</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Disease Information */}
                <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200 shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl text-red-800">
                      <Bug className="h-6 w-6" />
                      Disease Identification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-red-200">
                      <div className="flex items-start gap-4">
                        <div className="bg-red-100 p-3 rounded-full">
                          <Siren className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-red-900 mb-3">{result.diagnosis}</h3>
                          <div className="prose prose-red max-w-none">
                            <p className="text-red-800 leading-relaxed text-lg">{result.solution}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Audio Solution */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl text-green-800">
                      <Volume2 className="h-6 w-6"/>
                      Audio Treatment Guide
                    </CardTitle>
                    <p className="text-green-700/80">Listen to the detailed treatment instructions</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-green-200">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-green-100 p-3 rounded-full">
                          <PlayCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-green-800">Treatment Instructions</h3>
                          <p className="text-sm text-green-600">Available in your selected language</p>
                        </div>
                      </div>
                      
                      <audio 
                        controls 
                        src={result.audioUri} 
                        className="w-full h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-200"
                      />
                      
                      <div className="flex gap-3 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-green-300 text-green-700 hover:bg-green-100"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Audio
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-green-300 text-green-700 hover:bg-green-100"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Results
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-blue-800">
                      <BookOpen className="h-5 w-5" />
                      Next Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" className="h-auto p-4 border-blue-300 hover:bg-blue-100">
                        <div className="text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <Droplets className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-800">Treatment Schedule</span>
                          </div>
                          <p className="text-sm text-blue-600">Set up treatment reminders</p>
                        </div>
                      </Button>
                      
                      <Button variant="outline" className="h-auto p-4 border-blue-300 hover:bg-blue-100">
                        <div className="text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-800">Prevention Tips</span>
                          </div>
                          <p className="text-sm text-blue-600">Learn how to prevent recurrence</p>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Default State */}
            {!loading && !result && (
              <Card className="bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="bg-emerald-100 p-8 rounded-full mb-6">
                    <Stethoscope className="h-16 w-16 text-emerald-600" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-4">Ready for Plant Diagnosis</h3>
                  <p className="text-gray-600 text-lg max-w-md mb-6">
                    Upload or capture a clear image of your plant to get instant AI-powered disease detection and treatment recommendations
                  </p>
                  <div className="flex items-center gap-3 text-emerald-600">
                    <Sparkles className="h-5 w-5" />
                    <span className="font-medium">Powered by Advanced Plant Vision AI</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
