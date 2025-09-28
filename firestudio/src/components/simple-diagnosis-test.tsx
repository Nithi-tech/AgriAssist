'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SimpleDiagnosisTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testWithSampleImage = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Create a simple test image (1x1 pixel red image)
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#00ff00'; // Green (healthy leaf color)
        ctx.fillRect(0, 0, 100, 100);
      }
      const testImageDataUri = canvas.toDataURL('image/png');

      console.log('Testing with data URI:', testImageDataUri.substring(0, 50) + '...');

      const response = await fetch('/api/test-diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageDataUri: testImageDataUri
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'API request failed');
      }

      const data = await response.json();
      setResult(data.data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Test error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Disease Diagnosis Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testWithSampleImage} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Testing Gemini API...' : 'Test with Sample Image'}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <div><strong>Diagnosis:</strong> {result.diagnosis}</div>
                <div><strong>Solution:</strong> {result.solution}</div>
                {result.audioUri && (
                  <div><strong>Audio:</strong> Available</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
