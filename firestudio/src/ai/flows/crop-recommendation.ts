// Crop recommendation API client - now uses secure Next.js API route

'use server';

/**
 * @fileOverview Crop recommendation client that calls the secure API route.
 *
 * - recommendCrops - A function that handles the crop recommendation process.
 * - CropRecommendationInput - The input type for the recommendCrops function.
 * - CropRecommendationOutput - The return type for the recommendCrops function.
 */

import {z} from 'zod';

// Define valid soil types
const SOIL_TYPES = [
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

const CropRecommendationInputSchema = z.object({
  location: z.object({
    name: z.string().describe('The name of the location (city/region)'),
    lat: z.number().optional().describe('Latitude of the location'),
    lon: z.number().optional().describe('Longitude of the location'),
  }).describe('The geographical location of the farm'),
  soilType: z.enum(SOIL_TYPES).describe('The type of soil available on the farm'),
  language: z.enum(['english', 'hindi', 'tamil', 'telugu', 'bengali', 'marathi', 'gujarati', 'kannada', 'malayalam', 'punjabi']).describe('The preferred language for recommendations'),
});
export type CropRecommendationInput = z.infer<typeof CropRecommendationInputSchema>;

const CropDetailsSchema = z.object({
  name: z.string().describe('Name of the crop'),
  suitabilityPercentage: z.number().min(0).max(100).describe('Percentage indicating how suitable the crop is for the given conditions'),
  sowingTime: z.string().describe('Ideal sowing time for the crop in the given location'),
  expectedYield: z.string().describe('Expected yield per acre/hectare'),
  marketDemand: z.enum(['high', 'medium', 'low']).describe('Current market demand trend'),
  irrigationNeeds: z.string().describe('Basic irrigation requirements'),
  growthPeriod: z.number().describe('Average growth period in days'),
});

const CropRecommendationOutputSchema = z.object({
  recommendedCrops: z.array(CropDetailsSchema).describe('A list of recommended crops with detailed information'),
  reasoning: z.string().describe('The reasoning behind the crop recommendations'),
});
export type CropRecommendationOutput = z.infer<typeof CropRecommendationOutputSchema>;

/**
 * Get crop recommendations by calling the secure API route
 * This ensures the API key is never exposed to the frontend
 */
export async function recommendCrops(input: CropRecommendationInput): Promise<CropRecommendationOutput> {
  try {
    // Validate input
    const validatedInput = CropRecommendationInputSchema.parse(input);
    
    // Get the base URL for the API call
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    console.log('Calling crop recommendation API...');
    
    // Call the secure API route
    const response = await fetch(`${baseUrl}/api/crop-recommendation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedInput),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API response error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      let errorMessage = 'Failed to get crop recommendations';
      
      if (response.status === 500 && errorData.code === 'API_KEY_MISSING') {
        errorMessage = 'API Configuration Required: Please add your Google AI API key to the .env.local file.';
      } else if (response.status === 401 || response.status === 403) {
        errorMessage = 'Invalid API key. Please check your Google AI API key configuration.';
      } else if (response.status === 429) {
        errorMessage = 'API rate limit exceeded. Please try again later.';
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      console.error('Invalid API response:', result);
      throw new Error('Invalid response from crop recommendation API');
    }

    // Validate the output
    const validatedOutput = CropRecommendationOutputSchema.parse(result.data);
    
    console.log('Crop recommendation completed successfully');
    return validatedOutput;

  } catch (error) {
    console.error('Error in recommendCrops:', error);
    
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.errors.map(e => e.message).join(', ')}`);
    }
    
    throw error;
  }
}