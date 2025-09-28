'use client';

import React, { useState, useEffect } from 'react';
import { useEnhancedTranslation } from '@/hooks/useEnhancedTranslation';
import { TranslatedContentDisplay } from '@/components/TranslatedContentDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Languages, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Globe,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GovernmentScheme {
  id: number;
  name: string;
  description: string;
  eligibility: string;
  benefits: string;
  applicationProcess: string;
}

export default function I18nDemoPage() {
  const { t, translateText, language, isTranslating, translationError } = useEnhancedTranslation();
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTranslated, setIsTranslated] = useState(false);

  // Example static content for translation
  const exampleContent = {
    title: "Smart Agriculture with AI Technology",
    description: "AgriAssist uses artificial intelligence to provide farmers with personalized crop recommendations, disease diagnosis, and weather forecasts. Our platform supports multiple Indian languages to ensure accessibility for farmers across different regions.",
    benefits: [
      "Increase crop yield by 20-30%",
      "Reduce water usage through smart irrigation",
      "Early disease detection saves crops",
      "Weather-based farming decisions",
      "Government scheme recommendations"
    ]
  };

  // Fetch government schemes with translation
  const fetchSchemes = async (targetLang = language) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/translate-schemes?lang=${targetLang}`);
      const data = await response.json();
      
      if (data.success) {
        setSchemes(data.schemes);
        setIsTranslated(data.translated);
      } else {
        throw new Error(data.error || 'Failed to fetch schemes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schemes');
    } finally {
      setLoading(false);
    }
  };

  // Fetch schemes when component mounts or language changes
  useEffect(() => {
    fetchSchemes();
  }, [language]);

  // Direct translation example
  const [directTranslation, setDirectTranslation] = useState('');
  const [translatingDirect, setTranslatingDirect] = useState(false);

  const handleDirectTranslation = async () => {
    if (language === 'en') {
      setDirectTranslation(exampleContent.title);
      return;
    }

    setTranslatingDirect(true);
    try {
      const translated = await translateText(exampleContent.title);
      setDirectTranslation(translated);
    } catch (error) {
      console.error('Direct translation failed:', error);
      setDirectTranslation(exampleContent.title);
    } finally {
      setTranslatingDirect(false);
    }
  };

  useEffect(() => {
    handleDirectTranslation();
  }, [language]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg border">
            <Languages className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">
              {String(t('navbar.dashboard'))} - i18n Demo
            </h1>
            <Badge variant="outline">
              <Globe className="h-3 w-3 mr-1" />
              {language.toUpperCase()}
            </Badge>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This page demonstrates comprehensive i18n integration with static JSON translations 
            and dynamic Gemini API translations for content.
          </p>
        </div>

        {/* Translation Error Alert */}
        {translationError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              Translation Error: {translationError}
            </AlertDescription>
          </Alert>
        )}

        {/* Static Translation Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Static JSON Translations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="font-semibold text-gray-700">Dashboard</div>
                <div className="text-green-600">{String(t('navbar.dashboard'))}</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-700">Weather</div>
                <div className="text-blue-600">{String(t('navbar.weather'))}</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-700">Crop Recommendation</div>
                <div className="text-orange-600">{String(t('navbar.recommendation'))}</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-700">Community</div>
                <div className="text-purple-600">{String(t('navbar.community'))}</div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="font-semibold mb-2">Form Labels (Dynamic):</div>
              <div className="space-y-2 text-sm">
                <div><strong>Location:</strong> {String(t('forms.crop_recommendation.location'))}</div>
                <div><strong>Soil Type:</strong> {String(t('forms.crop_recommendation.soil_type'))}</div>
                <div><strong>Submit Button:</strong> {String(t('forms.crop_recommendation.submit'))}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Translation Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Dynamic Gemini AI Translations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Direct Translation Example */}
            <div>
              <h3 className="font-semibold mb-3">Direct Translation Example:</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Original (English):</div>
                <div className="font-medium mb-3">{exampleContent.title}</div>
                
                <div className="text-sm text-gray-600 mb-2">
                  Translated to {language.toUpperCase()}:
                </div>
                <div className="font-medium text-blue-700">
                  {translatingDirect ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Translating...</span>
                    </div>
                  ) : (
                    directTranslation
                  )}
                </div>
              </div>
            </div>

            {/* Benefits List Translation */}
            <div>
              <h3 className="font-semibold mb-3">Benefits List (Translated):</h3>
              <div className="grid gap-3">
                {exampleContent.benefits.map((benefit, index) => (
                  <TranslatedContentDisplay
                    key={index}
                    title={`Benefit ${index + 1}`}
                    content={benefit}
                    metadata={{
                      source: 'Direct Translation',
                      category: 'Feature Benefit'
                    }}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Government Schemes (CSV Content Translation) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Government Schemes (CSV Content Translation)
              </CardTitle>
              <div className="flex items-center gap-2">
                {isTranslated && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Translated
                  </Badge>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchSchemes()}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {schemes.map((scheme) => (
                  <Card key={scheme.id} className="border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-green-800">
                        {scheme.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-1">Description:</h4>
                        <p className="text-gray-600">{scheme.description}</p>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-1">Eligibility:</h4>
                          <p className="text-sm text-gray-600">{scheme.eligibility}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-1">Benefits:</h4>
                          <p className="text-sm text-gray-600">{scheme.benefits}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-1">Application:</h4>
                          <p className="text-sm text-gray-600">{scheme.applicationProcess}</p>
                        </div>
                      </div>
                      
                      {isTranslated && (
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-xs text-gray-500">
                            Content translated from English using Gemini AI
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Translation Status */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 text-blue-700">
                <Globe className="h-5 w-5" />
                <span className="font-semibold">Translation Status</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold">Current Language</div>
                  <Badge variant="outline">{language.toUpperCase()}</Badge>
                </div>
                <div className="text-center">
                  <div className="font-semibold">Static Translations</div>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="font-semibold">AI Translations</div>
                  <Badge variant="default" className="bg-purple-100 text-purple-800">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {language === 'en' ? 'Disabled' : 'Active'}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="font-semibold">API Status</div>
                  <Badge variant={translationError ? "destructive" : "default"} 
                         className={translationError ? "" : "bg-blue-100 text-blue-800"}>
                    {translationError ? 'Error' : 'Working'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
