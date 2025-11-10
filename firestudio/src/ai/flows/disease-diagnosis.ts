'use server';

/**
 * @fileOverview Disease diagnosis client that calls the secure API route.
 *
 * - diagnoseLeafDisease - A function that handles the plant disease diagnosis process.
 * - DiagnoseLeafDiseaseInput - The input type for the diagnoseLeafDisease function.
 * - DiagnoseLeafDiseaseOutput - The return type for the diagnoseLeafDisease function.
 */

import {z} from 'zod';

const DiagnoseLeafDiseaseInputSchema = z.object({
  leafImageDataUri: z
    .string()
    .describe(
      "A photo of a diseased leaf, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().optional().describe('Language for the diagnosis response'),
});
export type DiagnoseLeafDiseaseInput = z.infer<typeof DiagnoseLeafDiseaseInputSchema>;

const DiagnoseLeafDiseaseOutputSchema = z.object({
  diagnosis: z.string().describe('The diagnosis of the leaf disease.'),
  solution: z.string().describe('Potential solutions to address the disease.'),
  audioUri: z.string().optional().describe('The audio URI containing the solution in speech format.'),
});
export type DiagnoseLeafDiseaseOutput = z.infer<typeof DiagnoseLeafDiseaseOutputSchema>;

/**
 * Diagnose plant disease by calling the secure API route
 * This ensures the API key is never exposed to the frontend
 */
export async function diagnoseLeafDisease(input: DiagnoseLeafDiseaseInput): Promise<DiagnoseLeafDiseaseOutput> {
  try {
    console.log('Starting disease diagnosis with input:', { hasImage: !!input.leafImageDataUri });
    
    // Validate that we have a proper data URI
    if (!input.leafImageDataUri || !input.leafImageDataUri.startsWith('data:')) {
      throw new Error('Invalid image data URI provided');
    }

    // Validate input
    const validatedInput = DiagnoseLeafDiseaseInputSchema.parse(input);
    
    // Get the base URL for the API call
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    console.log('Calling disease diagnosis API...');
    
    // Call the secure API route
    const response = await fetch(`${baseUrl}/api/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'disease-diagnosis',
        imageDataUri: validatedInput.leafImageDataUri,
        language: validatedInput.language || 'en'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API response error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      let errorMessage = 'Failed to diagnose plant disease';
      
      if (response.status === 500 && errorData.code === 'API_KEY_MISSING') {
        errorMessage = 'API Configuration Required: Please add your Google AI API key to the .env.local file.';
      } else if (response.status === 401 || response.status === 403) {
        errorMessage = 'Invalid API key. Please check your Google AI API key configuration.';
      } else if (response.status === 429) {
        errorMessage = 'API rate limit exceeded. Please try again later.';
      } else if (response.status === 400 && errorData.error?.includes('image')) {
        errorMessage = 'Invalid image format. Please try a different image.';
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      console.error('Invalid API response:', result);
      throw new Error('Invalid response from disease diagnosis API');
    }

    console.log('Disease diagnosis completed successfully');
    
    // Return the result with proper structure
    return {
      diagnosis: result.data.diagnosis || 'Analysis completed',
      solution: result.data.solution || 'No specific solution provided',
      audioUri: undefined // Audio generation removed for simplicity
    };

  } catch (error) {
    console.error('Error in disease diagnosis:', error);
    
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.errors.map(e => e.message).join(', ')}`);
    }
    
    throw new Error(`Disease diagnosis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
