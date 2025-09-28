'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { recommendCrops, type CropRecommendationOutput } from '@/ai/flows/crop-recommendation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useEnhancedTranslation } from '@/hooks/useEnhancedTranslation';
import { 
  Loader2, 
  Sparkles, 
  Trees, 
  Microscope, 
  AlertTriangle, 
  Calendar, 
  Sprout, 
  Scale, 
  TrendingUp, 
  Droplet, 
  MapPin,
  Globe,
  Compass,
  CircleDot,
  Layers,
  Zap,
  Star,
  Shield,
  Target,
  Timer,
  DollarSign,
  Droplets,
  Gauge,
  Award,
  CheckCircle2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export function CropRecommendationForm() {
  const { t, translateText, language, isTranslating } = useEnhancedTranslation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CropRecommendationOutput | null>(null);
  const [translatedResult, setTranslatedResult] = useState<CropRecommendationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Translate result when language changes
  useEffect(() => {
    if (result && language !== 'en') {
      const translateResult = async () => {
        try {
          const translatedCrops = await Promise.all(
            result.recommendedCrops.map(async (crop) => ({
              ...crop,
              name: await translateText(crop.name),
              sowingTime: await translateText(crop.sowingTime),
              expectedYield: await translateText(crop.expectedYield),
              irrigationNeeds: await translateText(crop.irrigationNeeds),
            }))
          );

          setTranslatedResult({
            ...result,
            recommendedCrops: translatedCrops,
            reasoning: await translateText(result.reasoning),
          });
        } catch (error) {
          console.error('Translation error:', error);
          setTranslatedResult(result); // Fallback to original
        }
      };

      translateResult();
    } else {
      setTranslatedResult(result);
    }
  }, [result, language, translateText]);

  // Define soil types with enhanced descriptions and icons
  const SOIL_TYPES = [
    { 
      value: 'alluvial', 
      label: 'Alluvial Soil', 
      desc: 'Fertile riverbank soil, excellent for most crops',
      icon: '🏞️',
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    { 
      value: 'black', 
      label: 'Black Soil (Cotton Soil)', 
      desc: 'Rich in nutrients, ideal for cotton and sugarcane',
      icon: '⚫',
      color: 'bg-gray-50 border-gray-200 text-gray-800'
    },
    { 
      value: 'red', 
      label: 'Red Soil', 
      desc: 'Iron-rich soil, good for wheat and millets',
      icon: '🔴',
      color: 'bg-red-50 border-red-200 text-red-800'
    },
    { 
      value: 'laterite', 
      label: 'Laterite Soil', 
      desc: 'Good drainage, suitable for tea and coffee',
      icon: '🟤',
      color: 'bg-orange-50 border-orange-200 text-orange-800'
    },
    { 
      value: 'sandy', 
      label: 'Sandy Soil', 
      desc: 'Well-draining, good for root vegetables',
      icon: '🟡',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    },
    { 
      value: 'clayey', 
      label: 'Clay Soil', 
      desc: 'Water-retaining, suitable for rice cultivation',
      icon: '🟫',
      color: 'bg-amber-50 border-amber-200 text-amber-800'
    },
    { 
      value: 'loamy', 
      label: 'Loamy Soil', 
      desc: 'Perfect balance, ideal for most vegetables',
      icon: '🌱',
      color: 'bg-green-50 border-green-200 text-green-800'
    },
    { 
      value: 'silt', 
      label: 'Silty Soil', 
      desc: 'Smooth texture, good for grains',
      icon: '🟢',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800'
    },
    { 
      value: 'peaty', 
      label: 'Peat Soil', 
      desc: 'Organic-rich, excellent for organic farming',
      icon: '🍃',
      color: 'bg-lime-50 border-lime-200 text-lime-800'
    },
    { 
      value: 'chalky', 
      label: 'Chalky Soil', 
      desc: 'Alkaline soil, good for certain herbs',
      icon: '⚪',
      color: 'bg-slate-50 border-slate-200 text-slate-800'
    }
  ] as const;

  // Soil type values matching the AI flow enum  
  const SOIL_TYPE_VALUES = [
    'alluvial',
    'black', 
    'red',
    'laterite',
    'sandy',
    'clayey',
    'loamy',
    'silt',
    'peaty',
    'chalky'
  ] as const;

const formSchema = z.object({
  location: z.object({
    name: z.string().min(1, "Location is required"),
    lat: z.number().optional(),
    lon: z.number().optional(),
  }),
  soilType: z.enum(['alluvial', 'black', 'red', 'laterite', 'sandy', 'clayey', 'loamy', 'silt', 'peaty', 'chalky'], {
    required_error: "Please select a soil type",
  }),
  language: z.enum(['english', 'hindi', 'tamil', 'telugu', 'bengali', 'marathi', 'gujarati', 'kannada', 'malayalam', 'punjabi'], {
    required_error: "Please select a language",
  }),
});

  const [gpsLoading, setGpsLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: {
        name: '',
        lat: undefined,
        lon: undefined,
      },
      soilType: 'alluvial',
      language: 'english',
    },
  });

  // Function to get location name from coordinates using reverse geocoding
  const getLocationName = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=YOUR_OPENCAGE_API_KEY`
      );
      const data = await response.json();
      if (data.results && data.results[0]) {
        return data.results[0].formatted;
      }
      return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    }
  };

  // Function to get user's current location
  const getCurrentLocation = () => {
    setGpsLoading(true);
    setLocationError(null);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationName = await getLocationName(latitude, longitude);
          
          form.setValue('location', {
            name: locationName,
            lat: latitude,
            lon: longitude,
          });
          
          setGpsLoading(false);
        },
        (error) => {
          setLocationError('Unable to get your location. Please enter it manually.');
          setGpsLoading(false);
          console.error('Geolocation error:', error);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      setGpsLoading(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const recommendation = await recommendCrops(values);
      setResult(recommendation);
      setRetryCount(0); // Reset retry count on success
    } catch (error: any) {
      console.error('Error getting crop recommendation:', error);
      let errorMessage = error?.message || 'Failed to get crop recommendations. Please try again.';
      
      // Check for API configuration issues
      if (errorMessage.includes('API key') || errorMessage.includes('not configured') || errorMessage.includes('401') || errorMessage.includes('403')) {
        errorMessage = '⚠️ API Configuration Required: Please add your Google AI API key to the .env.local file. Check the API_SETUP_GUIDE.md for instructions.';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorMessage = '🌐 Network Error: Please check your internet connection and try again.';
      } else if (errorMessage.includes('busy') || errorMessage.includes('overloaded') || errorMessage.includes('unavailable')) {
        errorMessage = '⏳ Service Busy: The AI service is currently overloaded. Please try again in a moment.';
        setRetryCount(prev => prev + 1);
      } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        errorMessage = '📊 API Limit Reached: You have reached your API usage limit. Please check your API quota.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Auto-retry function for overload errors
  const handleRetry = () => {
    onSubmit(form.getValues());
  };

  if (!isClient) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card className="flex items-center justify-center h-full min-h-[200px]">
          <div className="text-center text-muted-foreground">
            <p>Loading...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Enhanced Header Section */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-100 to-emerald-100 px-6 py-3 rounded-full border border-green-200">
          <Sparkles className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold text-green-800">AI-Powered Crop Recommendation</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Get personalized crop suggestions based on your location and soil type using advanced machine learning
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Enhanced Input Form */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl text-green-800">
                <Target className="h-6 w-6" />
                Farm Details
              </CardTitle>
              <p className="text-green-700/80">Provide your location and soil information for accurate recommendations</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Enhanced Location Input */}
                  <FormField
                    control={form.control}
                    name="location.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-green-800 font-semibold flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {t('forms.crop_recommendation.location')}
                        </FormLabel>
                        <FormDescription className="text-green-700/70">
                          {t('forms.crop_recommendation.location_placeholder')}
                          Enter your city, district, or region for weather-specific recommendations
                        </FormDescription>
                        <div className="relative">
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-600" />
                              <Input 
                                placeholder="e.g., Mumbai, Maharashtra or Punjab, India" 
                                className="pl-10 pr-20 h-12 text-lg border-green-300 focus:border-green-500 bg-white"
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={getCurrentLocation}
                                disabled={gpsLoading}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 border-green-300 text-green-700 hover:bg-green-100"
                              >
                                {gpsLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Compass className="h-4 w-4 mr-1" />
                                    GPS
                                  </>
                                )}
                              </Button>
                            </div>
                          </FormControl>
                        </div>
                        {locationError && (
                          <Alert className="border-red-200 bg-red-50">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-700">{locationError}</AlertDescription>
                          </Alert>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Enhanced Soil Type Selection */}
                  <FormField
                    control={form.control}
                    name="soilType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-green-800 font-semibold flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          {t('forms.crop_recommendation.soil_type')}
                        </FormLabel>
                        <FormDescription className="text-green-700/70">
                          {t('forms.crop_recommendation.soil_type_placeholder')}
                        </FormDescription>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 text-lg border-green-300 focus:border-green-500 bg-white">
                              <SelectValue placeholder="Choose your soil type..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-96">
                            {SOIL_TYPES.map((soil) => (
                              <SelectItem key={soil.value} value={soil.value} className="p-4">
                                <div className="flex items-start gap-3">
                                  <span className="text-2xl">{soil.icon}</span>
                                  <div className="space-y-1">
                                    <div className="font-semibold text-gray-800">{soil.label}</div>
                                    <div className="text-sm text-gray-600">{soil.desc}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Language Selection Field */}
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-green-800 font-semibold flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Language / भाषा
                        </FormLabel>
                        <FormDescription className="text-green-700/70">
                          Select your preferred language for recommendations
                        </FormDescription>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 text-lg border-green-300 focus:border-green-500 bg-white">
                              <SelectValue placeholder="Choose your preferred language..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-96">
                            <SelectItem value="english" className="p-4">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">🇬🇧</span>
                                <div className="space-y-1">
                                  <div className="font-semibold text-gray-800">English</div>
                                  <div className="text-sm text-gray-600">Get recommendations in English</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="hindi" className="p-4">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">🇮🇳</span>
                                <div className="space-y-1">
                                  <div className="font-semibold text-gray-800">हिन्दी (Hindi)</div>
                                  <div className="text-sm text-gray-600">हिन्दी में सुझाव प्राप्त करें</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="tamil" className="p-4">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">🇮🇳</span>
                                <div className="space-y-1">
                                  <div className="font-semibold text-gray-800">தமிழ் (Tamil)</div>
                                  <div className="text-sm text-gray-600">தமிழில் பரிந்துரைகள் பெறுங்கள்</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="telugu" className="p-4">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">🇮🇳</span>
                                <div className="space-y-1">
                                  <div className="font-semibold text-gray-800">తెలుగు (Telugu)</div>
                                  <div className="text-sm text-gray-600">తెలుగులో సిఫార్సులు పొందండి</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="bengali" className="p-4">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">🇮🇳</span>
                                <div className="space-y-1">
                                  <div className="font-semibold text-gray-800">বাংলা (Bengali)</div>
                                  <div className="text-sm text-gray-600">বাংলায় সুপারিশ পান</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="marathi" className="p-4">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">🇮🇳</span>
                                <div className="space-y-1">
                                  <div className="font-semibold text-gray-800">मराठी (Marathi)</div>
                                  <div className="text-sm text-gray-600">मराठीत शिफारसी मिळवा</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="gujarati" className="p-4">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">🇮🇳</span>
                                <div className="space-y-1">
                                  <div className="font-semibold text-gray-800">ગુજરાતી (Gujarati)</div>
                                  <div className="text-sm text-gray-600">ગુજરાતીમાં ભલામણો મેળવો</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="kannada" className="p-4">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">🇮🇳</span>
                                <div className="space-y-1">
                                  <div className="font-semibold text-gray-800">ಕನ್ನಡ (Kannada)</div>
                                  <div className="text-sm text-gray-600">ಕನ್ನಡದಲ್ಲಿ ಶಿಫಾರಸುಗಳನ್ನು ಪಡೆಯಿರಿ</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="malayalam" className="p-4">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">🇮🇳</span>
                                <div className="space-y-1">
                                  <div className="font-semibold text-gray-800">മലയാളം (Malayalam)</div>
                                  <div className="text-sm text-gray-600">മലയാളത്തിൽ ശുപാർശകൾ നേടുക</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="punjabi" className="p-4">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">🇮🇳</span>
                                <div className="space-y-1">
                                  <div className="font-semibold text-gray-800">ਪੰਜਾਬੀ (Punjabi)</div>
                                  <div className="text-sm text-gray-600">ਪੰਜਾਬੀ ਵਿੱਚ ਸਿਫਾਰਸ਼ਾਂ ਪ੍ਰਾਪਤ ਕਰੋ</div>
                                </div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Enhanced Submit Button */}
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>{t('forms.crop_recommendation.submitting')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5" />
                        <span>{t('forms.crop_recommendation.submit')}</span>
                      </div>
                    )}
                  </Button>

                  {/* Enhanced Error Display */}
                  {error && (
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        {error}
                        {retryCount > 0 && retryCount < 3 && (
                          <div className="mt-3">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={handleRetry}
                              className="text-amber-700 border-amber-300 hover:bg-amber-100"
                            >
                              <Timer className="h-4 w-4 mr-2" />
                              Try Again ({3 - retryCount} attempts remaining)
                            </Button>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Benefits Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-blue-800">
                <Star className="h-5 w-5" />
                Why Use AI Recommendations?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Higher Success Rate</p>
                    <p className="text-sm text-blue-700/80">AI analyzes climate, soil, and market data for optimal choices</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Better Profits</p>
                    <p className="text-sm text-blue-700/80">Market demand analysis helps maximize your returns</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Droplet className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Resource Efficient</p>
                    <p className="text-sm text-blue-700/80">Optimized water and fertilizer usage recommendations</p>
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
                <div className="relative">
                  <div className="w-20 h-20 bg-purple-200 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
                  </div>
                </div>
                <div className="text-center mt-6 space-y-2">
                  <p className="text-xl font-semibold text-purple-800">Analyzing Your Farm Data</p>
                  <p className="text-purple-700/80">Our AI is processing climate, soil, and market conditions...</p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <CircleDot className="h-4 w-4 text-purple-600 animate-bounce" />
                    <CircleDot className="h-4 w-4 text-purple-600 animate-bounce" style={{animationDelay: '0.1s'}} />
                    <CircleDot className="h-4 w-4 text-purple-600 animate-bounce" style={{animationDelay: '0.2s'}} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {result && (
            <div className="space-y-6">
              {/* Results Header */}
              <Card className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-full">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Recommendation Ready!</h2>
                      <p className="text-emerald-100">Here are the best crops for your farm conditions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Crops Grid */}
              <div className="grid gap-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <Trees className="h-6 w-6 text-green-600"/>
                  {t('recommendations.recommended_crops') || 'Recommended Crops'}
                </h3>
                
                {(translatedResult || result).recommendedCrops.map((crop, index) => (
                  <Card key={crop.name} className="bg-gradient-to-br from-white to-green-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge className={`px-3 py-1 text-lg font-semibold ${
                              index === 0 ? 'bg-gold text-yellow-800 border-yellow-300' : 
                              index === 1 ? 'bg-gray-200 text-gray-800 border-gray-300' : 
                              'bg-orange-100 text-orange-800 border-orange-300'
                            }`}>
                              #{index + 1}
                            </Badge>
                            <h4 className="text-2xl font-bold text-gray-800">{crop.name}</h4>
                          </div>
                          <div className="flex items-center gap-3">
                            <Award className="h-5 w-5 text-green-600" />
                            <span className="text-lg font-semibold text-green-700">
                              {crop.suitabilityPercentage}% Suitable
                            </span>
                            <Progress 
                              value={crop.suitabilityPercentage} 
                              className="w-32 h-2"
                            />
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                            crop.marketDemand === 'high' ? 'bg-green-100 text-green-800' :
                            crop.marketDemand === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            <TrendingUp className="h-4 w-4" />
                            {crop.marketDemand.toUpperCase()} DEMAND
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="bg-white/60 p-4 rounded-lg border border-green-200">
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-gray-700">Sowing Time</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-800">{crop.sowingTime}</p>
                        </div>

                        <div className="bg-white/60 p-4 rounded-lg border border-green-200">
                          <div className="flex items-center gap-3 mb-2">
                            <Timer className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-gray-700">Growth Period</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-800">{crop.growthPeriod} days</p>
                        </div>

                        <div className="bg-white/60 p-4 rounded-lg border border-green-200">
                          <div className="flex items-center gap-3 mb-2">
                            <Scale className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-gray-700">Expected Yield</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-800">{crop.expectedYield}</p>
                        </div>

                        <div className="bg-white/60 p-4 rounded-lg border border-green-200">
                          <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-gray-700">Market Demand</span>
                          </div>
                          <p className={`text-lg font-semibold capitalize ${
                            crop.marketDemand === 'high' ? 'text-green-600' : 
                            crop.marketDemand === 'medium' ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {crop.marketDemand}
                          </p>
                        </div>

                        <div className="bg-white/60 p-4 rounded-lg border border-green-200">
                          <div className="flex items-center gap-3 mb-2">
                            <Droplets className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-gray-700">Irrigation Needs</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-800">{crop.irrigationNeeds}</p>
                        </div>

                        <div className="bg-white/60 p-4 rounded-lg border border-green-200">
                          <div className="flex items-center gap-3 mb-2">
                            <Gauge className="h-5 w-5 text-purple-600" />
                            <span className="font-medium text-gray-700">Suitability</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={crop.suitabilityPercentage} className="flex-1 h-3" />
                            <span className="text-sm font-medium">{crop.suitabilityPercentage}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* AI Reasoning Section */}
              <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl text-indigo-800">
                    <Microscope className="h-6 w-6"/>
                    AI Analysis & Reasoning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white/60 p-6 rounded-lg border border-indigo-200">
                    <p className="text-gray-700 leading-relaxed text-lg">{(translatedResult || result).reasoning}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Default State */}
          {!loading && !result && (
            <Card className="bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200 shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-green-100 p-6 rounded-full mb-6">
                  <Sprout className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Ready to Get Started?</h3>
                <p className="text-gray-600 text-lg max-w-md">
                  Fill in your farm details on the left to receive personalized crop recommendations powered by AI
                </p>
                <div className="flex items-center gap-2 mt-6 text-green-600">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-medium">Powered by Advanced Machine Learning</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
