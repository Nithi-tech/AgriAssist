'use server';

/**
 * @fileOverview This file contains the Genkit flow for diagnosing plant diseases from leaf images.
 *
 * - diagnoseLeafDisease - A function that handles the plant disease diagnosis process.
 * - DiagnoseLeafDiseaseInput - The input type for the diagnoseLeafDisease function.
 * - DiagnoseLeafDiseaseOutput - The return type for the diagnoseLeafDisease function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const DiagnoseLeafDiseaseInputSchema = z.object({
  leafImageDataUri: z
    .string()
    .describe(
      "A photo of a diseased leaf, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DiagnoseLeafDiseaseInput = z.infer<typeof DiagnoseLeafDiseaseInputSchema>;

const DiagnoseLeafDiseaseOutputSchema = z.object({
  diagnosis: z.string().describe('The diagnosis of the leaf disease.'),
  solution: z.string().describe('Potential solutions to address the disease.'),
  audioUri: z.string().optional().describe('The audio URI containing the solution in speech format.'),
});
export type DiagnoseLeafDiseaseOutput = z.infer<typeof DiagnoseLeafDiseaseOutputSchema>;

export async function diagnoseLeafDisease(input: DiagnoseLeafDiseaseInput): Promise<DiagnoseLeafDiseaseOutput> {
  try {
    console.log('Starting disease diagnosis with input:', { hasImage: !!input.leafImageDataUri });
    
    // Validate that we have a proper data URI
    if (!input.leafImageDataUri || !input.leafImageDataUri.startsWith('data:')) {
      throw new Error('Invalid image data URI provided');
    }

    // Use Gemini 1.5 Flash for multimodal analysis
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: [
        {
          text: `You are an expert plant pathologist. Analyze this leaf image and provide:
          1. A detailed diagnosis of any disease, pest damage, or health issues
          2. Specific treatment recommendations and solutions
          3. Preventive measures for the future
          
          Please be thorough and practical in your response. If the leaf appears healthy, say so.`
        },
        {
          media: {
            url: input.leafImageDataUri,
            contentType: input.leafImageDataUri.split(';')[0].split(':')[1] || 'image/jpeg'
          }
        }
      ],
    });

    console.log('Gemini API response received');

    if (!response.text) {
      throw new Error('No response text from Gemini API');
    }

    // Parse the response to extract diagnosis and solution
    const fullResponse = response.text;
    
    // Simple parsing - you can make this more sophisticated
    const diagnosisMatch = fullResponse.match(/(?:diagnosis|disease|condition):\s*(.+?)(?:\n|solution|treatment|$)/i);
    const solutionMatch = fullResponse.match(/(?:solution|treatment|recommendation):\s*(.+?)(?:\n|prevention|$)/i);
    
    const diagnosis = diagnosisMatch?.[1]?.trim() || fullResponse.split('\n')[0] || 'Analysis completed';
    const solution = solutionMatch?.[1]?.trim() || fullResponse;

    return {
      diagnosis,
      solution,
      audioUri: undefined // Audio generation removed for simplicity
    };

  } catch (error) {
    console.error('Error in disease diagnosis:', error);
    throw new Error(`Disease diagnosis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
