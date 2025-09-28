'use client';

import React, { useState, useEffect } from 'react';
import { useEnhancedTranslation } from '@/hooks/useEnhancedTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Globe, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TranslatedContentProps {
  title: string;
  content: string;
  metadata?: {
    source?: string;
    confidence?: number;
    category?: string;
  };
}

export function TranslatedContentDisplay({ title, content, metadata }: TranslatedContentProps) {
  const { t, translateText, language, isTranslating, translationError } = useEnhancedTranslation();
  const [translatedTitle, setTranslatedTitle] = useState(title);
  const [translatedContent, setTranslatedContent] = useState(content);
  const [lastLanguage, setLastLanguage] = useState(language);

  // Translate content when language changes
  useEffect(() => {
    if (language !== lastLanguage && language !== 'en') {
      const translateAll = async () => {
        try {
          const [newTitle, newContent] = await Promise.all([
            translateText(title),
            translateText(content)
          ]);
          setTranslatedTitle(newTitle);
          setTranslatedContent(newContent);
          setLastLanguage(language);
        } catch (error) {
          console.error('Translation failed:', error);
          // Fallback to original content
          setTranslatedTitle(title);
          setTranslatedContent(content);
        }
      };

      translateAll();
    } else if (language === 'en') {
      setTranslatedTitle(title);
      setTranslatedContent(content);
      setLastLanguage(language);
    }
  }, [language, title, content, translateText, lastLanguage]);

  const handleRetranslate = async () => {
    if (language === 'en') return;
    
    try {
      const [newTitle, newContent] = await Promise.all([
        translateText(title),
        translateText(content)
      ]);
      setTranslatedTitle(newTitle);
      setTranslatedContent(newContent);
    } catch (error) {
      console.error('Re-translation failed:', error);
    }
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold">
            {isTranslating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-gray-500">{String(t('loading'))}</span>
              </div>
            ) : (
              translatedTitle
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Language indicator */}
            <Badge variant="outline" className="text-xs">
              <Globe className="h-3 w-3 mr-1" />
              {language.toUpperCase()}
            </Badge>
            
            {/* Re-translate button */}
            {language !== 'en' && !isTranslating && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetranslate}
                className="h-8 w-8 p-0"
                title={String(t('forms.crop_recommendation.submit'))}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Metadata */}
        {metadata && (
          <div className="flex flex-wrap gap-2 mt-2">
            {metadata.source && (
              <Badge variant="secondary" className="text-xs">
                {metadata.source}
              </Badge>
            )}
            {metadata.category && (
              <Badge variant="outline" className="text-xs">
                {metadata.category}
              </Badge>
            )}
            {metadata.confidence && (
              <Badge 
                variant={metadata.confidence > 0.8 ? "default" : "secondary"} 
                className="text-xs"
              >
                {Math.round(metadata.confidence * 100)}% confidence
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {translationError && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <AlertDescription className="text-amber-800">
              {translationError}
            </AlertDescription>
          </Alert>
        )}

        <div className="prose prose-sm max-w-none">
          {isTranslating ? (
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-gray-700">
              {translatedContent}
            </p>
          )}
        </div>

        {/* AI Translation indicator */}
        {language !== 'en' && !isTranslating && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
            <Sparkles className="h-3 w-3 text-purple-500" />
            <span className="text-xs text-gray-500">
              Translated by AI from English
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Example usage component for crop recommendations
export function CropRecommendationResult({ recommendation }: { recommendation: any }) {
  const { t } = useEnhancedTranslation();

  if (!recommendation) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-green-800 mb-4">
        {String(t('forms.crop_recommendation.success'))}
      </h2>
      
      {recommendation.crops?.map((crop: any, index: number) => (
        <TranslatedContentDisplay
          key={index}
          title={crop.name}
          content={`${crop.description}\n\nBenefits: ${crop.benefits}\n\nTips: ${crop.tips}`}
          metadata={{
            source: 'AI Recommendation',
            confidence: crop.confidence,
            category: 'Crop Suggestion'
          }}
        />
      ))}
      
      {recommendation.explanation && (
        <TranslatedContentDisplay
          title="Detailed Explanation"
          content={recommendation.explanation}
          metadata={{
            source: 'AI Analysis',
            category: 'Explanation'
          }}
        />
      )}
    </div>
  );
}
