// Genkit configuration - now using secure API route instead of direct API calls
// This file is kept for backward compatibility but AI flows now use the secure API route

import {genkit, z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Note: This configuration is now primarily used for development/testing
// Production AI calls should use the secure /api/gemini route
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

export {z};
