// A Genkit flow to provide crop recommendations based on location, soil type, and weather conditions.

'use server';

/**
 * @fileOverview Crop recommendation AI agent.
 *
 * - recommendCrops - A function that handles the crop recommendation process.
 * - CropRecommendationInput - The input type for the recommendCrops function.
 * - CropRecommendationOutput - The return type for the recommendCrops function.
 */

import {ai} from '@/ai/genkit';
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

export async function recommendCrops(input: CropRecommendationInput): Promise<CropRecommendationOutput> {
  return recommendCropsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cropRecommendationPrompt',
  input: {schema: CropRecommendationInputSchema},
  output: {schema: CropRecommendationOutputSchema},
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are an expert agricultural advisor. Based on the farmer's location, soil type, and preferred language, recommend the best crops to plant. Consider the typical climate patterns and growing seasons for the location. For each crop, provide detailed information about its suitability and growing requirements.

Location: {{{location.name}}} (Coordinates: {{{location.lat}}}, {{{location.lon}}})
Soil Type: {{{soilType}}}
Language: {{{language}}}

IMPORTANT: Provide ALL responses in the requested language ({{{language}}}). If the language is not English, translate all crop names, descriptions, and explanations to that language while keeping the JSON structure intact.

For each recommended crop, provide:
1. A suitability percentage (0-100%) based on:
   - How well the crop matches the soil type
   - Regional climate suitability
   - Typical success rate in the region
2. Ideal sowing time based on the location's seasonal patterns
3. Expected yield per acre/hectare based on typical farming practices
4. Current market demand (high/medium/low)
5. Basic irrigation requirements
6. Average growth period in days

Respond in a format that can be parsed as a JSON object with:
- recommendedCrops: an array of objects containing:
  - name: crop name (in the requested language)
  - suitabilityPercentage: number (0-100)
  - sowingTime: string (e.g., "October-November" in the requested language)
  - expectedYield: string (e.g., "3-4 tons/acre" in the requested language)
  - marketDemand: "high", "medium", or "low" (in the requested language)
  - irrigationNeeds: string (e.g., "moderate, 500-600mm per season" in the requested language)
  - growthPeriod: number (days)
- reasoning: string explaining the overall recommendation (in the requested language)

Ensure all numeric values are realistic and based on agricultural data. All text content should be in the language specified by the user.`,
});

const recommendCropsFlow = ai.defineFlow(
  {
    name: 'recommendCropsFlow',
    inputSchema: CropRecommendationInputSchema,
    outputSchema: CropRecommendationOutputSchema,
  },
  async (input: CropRecommendationInput) => {
    const {output} = await prompt(input);
    return output!;
  }
);