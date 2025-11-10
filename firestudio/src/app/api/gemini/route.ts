import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to ensure API key security
export const dynamic = 'force-dynamic';

/**
 * Unified Gemini API Route
 * 
 * This route securely handles all Gemini API calls for:
 * - Crop Recommendations
 * - Disease Diagnosis (multimodal)
 * - Weather Chat
 * - General Chat
 * - Translation
 * 
 * The API key is kept secure on the server and never exposed to the frontend.
 */

// Type definitions for different request types
interface CropRecommendationRequest {
  type: 'crop-recommendation';
  location: {
    name: string;
    lat?: number;
    lon?: number;
  };
  soilType: string;
  language: string;
}

interface DiseaseDiagnosisRequest {
  type: 'disease-diagnosis';
  imageDataUri: string;
  language?: string;
}

interface WeatherChatRequest {
  type: 'weather-chat';
  query: string;
  weatherData?: any;
  language?: string;
}

interface GeneralChatRequest {
  type: 'general-chat';
  message: string;
  language?: string;
  history?: Array<{role: string; content: string}>;
}

interface TranslationRequest {
  type: 'translation';
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

type GeminiRequest = 
  | CropRecommendationRequest 
  | DiseaseDiagnosisRequest 
  | WeatherChatRequest 
  | GeneralChatRequest
  | TranslationRequest;

// Language detection helper
function detectLanguage(text: string): string {
  if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Hindi
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te'; // Telugu
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml'; // Malayalam
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'; // Kannada
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu'; // Gujarati
  if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali
  return 'en'; // Default to English
}

// Crop recommendation prompt generator
function getCropRecommendationPrompt(request: CropRecommendationRequest): string {
  const { location, soilType, language } = request;
  
  return `You are an expert agricultural advisor. Based on the farmer's location, soil type, and preferred language, recommend the best crops to plant. Consider the typical climate patterns and growing seasons for the location.

Location: ${location.name} ${location.lat && location.lon ? `(${location.lat}, ${location.lon})` : ''}
Soil Type: ${soilType}
Language: ${language}

IMPORTANT: Provide ALL responses in the requested language (${language}). If the language is not English, translate all crop names, descriptions, and explanations to that language while keeping the JSON structure intact.

For each recommended crop, provide:
1. A suitability percentage (0-100%) based on soil type, climate suitability, and regional success rate
2. Ideal sowing time based on location's seasonal patterns
3. Expected yield per acre/hectare
4. Current market demand (high/medium/low)
5. Basic irrigation requirements
6. Average growth period in days

Respond in JSON format with:
{
  "recommendedCrops": [
    {
      "name": "crop name (in requested language)",
      "suitabilityPercentage": number,
      "sowingTime": "timing (in requested language)",
      "expectedYield": "yield info (in requested language)",
      "marketDemand": "high/medium/low",
      "irrigationNeeds": "irrigation info (in requested language)",
      "growthPeriod": number
    }
  ],
  "reasoning": "explanation in requested language"
}`;
}

// Disease diagnosis prompt generator
function getDiseaseDiagnosisPrompt(request: DiseaseDiagnosisRequest): any[] {
  const language = request.language || 'en';
  
  return [
    {
      text: `You are an expert plant pathologist. Analyze this leaf image and provide a detailed diagnosis in ${language === 'en' ? 'English' : language}.

Provide:
1. A detailed diagnosis of any disease, pest damage, or health issues
2. Specific treatment recommendations and solutions
3. Preventive measures for the future

Respond in JSON format:
{
  "diagnosis": "detailed diagnosis in ${language}",
  "solution": "treatment recommendations and preventive measures in ${language}"
}

If the leaf appears healthy, mention that in your diagnosis. Be thorough and practical in your response.`
    },
    {
      inline_data: {
        mime_type: request.imageDataUri.split(';')[0].split(':')[1] || 'image/jpeg',
        data: request.imageDataUri.split(',')[1]
      }
    }
  ];
}

// Weather chat prompt generator
function getWeatherChatPrompt(request: WeatherChatRequest): string {
  const { query, weatherData, language = 'en' } = request;
  
  let prompt = `You are a friendly weather assistant for farmers. Answer the user's weather-related question in ${language === 'en' ? 'English' : language}.

User Question: ${query}`;

  if (weatherData) {
    prompt += `

Current Weather Data:
${JSON.stringify(weatherData, null, 2)}

Use this weather data to provide accurate, farming-focused advice.`;
  }

  prompt += `

Provide practical farming advice based on weather conditions. Focus on:
- How weather affects crops
- Best practices for current conditions
- Timing recommendations for farming activities
- Weather-based crop protection advice

Respond naturally and helpfully in ${language === 'en' ? 'English' : language}.`;

  return prompt;
}

// General chat prompt generator
function getGeneralChatPrompt(request: GeneralChatRequest): any[] {
  const { message, language = 'en', history = [] } = request;
  
  const systemPrompt = `You are AgriAssist, an expert AI farming assistant specializing in Indian agriculture. 
Provide helpful, accurate, and practical advice on:
- Crop recommendations based on soil, weather, and region
- Disease diagnosis and treatment solutions
- Weather-based farming guidance
- Government schemes and subsidies for farmers
- Sustainable farming practices
- Market prices and timing

Always respond in ${language === 'en' ? 'English' : language} in a friendly, supportive manner. Keep responses concise but informative.
If asked about non-farming topics, politely redirect to agricultural matters.`;

  const contents = [
    {
      role: 'user',
      parts: [{ text: systemPrompt }]
    }
  ];

  // Add conversation history (last 5 messages)
  history.slice(-5).forEach((msg: any) => {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  });

  // Add current message
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  return contents;
}

// Translation prompt generator
function getTranslationPrompt(request: TranslationRequest): string {
  const { text, targetLanguage, sourceLanguage = 'auto' } = request;
  
  return `Translate the following text ${sourceLanguage !== 'auto' ? `from ${sourceLanguage}` : ''} to ${targetLanguage}.
Only return the translated text, nothing else.

Text to translate: ${text}`;
}

export async function POST(req: NextRequest) {
  try {
    // Get the API key from environment variables
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY environment variable is not set');
      return NextResponse.json(
        { 
          error: 'Server configuration error',
          message: 'Gemini API key is not configured. Please check your environment variables.',
          code: 'API_KEY_MISSING'
        }, 
        { status: 500 }
      );
    }

    // Parse the request body
    const requestData: GeminiRequest = await req.json();
    
    if (!requestData.type) {
      return NextResponse.json(
        { error: 'Request type is required' },
        { status: 400 }
      );
    }

    console.log(`Processing ${requestData.type} request`);

    // Prepare the API request based on request type
    let apiUrl: string;
    let requestBody: any;

    switch (requestData.type) {
      case 'crop-recommendation':
      case 'weather-chat':
      case 'general-chat':
      case 'translation':
        // Use generateContent endpoint for text-only requests
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
        
        let prompt: string;
        let contents: any;

        if (requestData.type === 'crop-recommendation') {
          prompt = getCropRecommendationPrompt(requestData);
          contents = [{ role: 'user', parts: [{ text: prompt }] }];
        } else if (requestData.type === 'weather-chat') {
          prompt = getWeatherChatPrompt(requestData);
          contents = [{ role: 'user', parts: [{ text: prompt }] }];
        } else if (requestData.type === 'general-chat') {
          contents = getGeneralChatPrompt(requestData);
        } else if (requestData.type === 'translation') {
          prompt = getTranslationPrompt(requestData);
          contents = [{ role: 'user', parts: [{ text: prompt }] }];
        }

        requestBody = {
          contents,
          generationConfig: {
            temperature: requestData.type === 'translation' ? 0.3 : 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: requestData.type === 'crop-recommendation' ? 2048 : 1024,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        };
        break;

      case 'disease-diagnosis':
        // Use generateContent endpoint with multimodal support
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
        
        if (!requestData.imageDataUri || !requestData.imageDataUri.startsWith('data:')) {
          return NextResponse.json(
            { error: 'Valid image data URI is required for disease diagnosis' },
            { status: 400 }
          );
        }

        const parts = getDiseaseDiagnosisPrompt(requestData);
        requestBody = {
          contents: [{ role: 'user', parts }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid request type' },
          { status: 400 }
        );
    }

    // Make the request to Gemini API
    console.log('Sending request to Gemini API...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });

      let errorMessage = 'Failed to get response from Gemini API';
      let errorCode = 'GEMINI_API_ERROR';

      if (response.status === 401 || response.status === 403) {
        errorMessage = 'Invalid API key or insufficient permissions';
        errorCode = 'API_KEY_INVALID';
      } else if (response.status === 429) {
        errorMessage = 'API rate limit exceeded. Please try again later.';
        errorCode = 'RATE_LIMIT_EXCEEDED';
      } else if (response.status === 400) {
        errorMessage = errorData.error?.message || 'Invalid request format';
        errorCode = 'INVALID_REQUEST';
      } else if (response.status >= 500) {
        errorMessage = 'Gemini API service is temporarily unavailable';
        errorCode = 'SERVICE_UNAVAILABLE';
      }

      return NextResponse.json(
        {
          error: errorMessage,
          code: errorCode,
          details: errorData.error?.message
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Gemini API response received successfully');

    // Extract the response text
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      console.error('No response text from Gemini API:', data);
      return NextResponse.json(
        {
          error: 'No response received from Gemini API',
          code: 'NO_RESPONSE',
          details: data
        },
        { status: 500 }
      );
    }

    // Process the response based on request type
    let processedResponse: any;

    try {
      if (requestData.type === 'crop-recommendation' || requestData.type === 'disease-diagnosis') {
        // Try to parse JSON response
        processedResponse = JSON.parse(responseText);
      } else {
        // For chat and translation, return text directly
        processedResponse = {
          response: responseText,
          detectedLanguage: requestData.type === 'general-chat' ? detectLanguage(requestData.message) : undefined
        };
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      
      if (requestData.type === 'crop-recommendation' || requestData.type === 'disease-diagnosis') {
        // For structured responses, return error if JSON parsing fails
        return NextResponse.json(
          {
            error: 'Invalid response format from Gemini API',
            code: 'PARSE_ERROR',
            rawResponse: responseText
          },
          { status: 500 }
        );
      } else {
        // For chat responses, return as plain text if JSON parsing fails
        processedResponse = { response: responseText };
      }
    }

    return NextResponse.json({
      success: true,
      data: processedResponse,
      type: requestData.type
    });

  } catch (error: any) {
    console.error('Gemini API route error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

// Handle GET requests (for health check)
export async function GET() {
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  
  return NextResponse.json({
    status: 'Gemini API route is active',
    configured: hasApiKey,
    model: 'gemini-2.0-flash',
    supportedTypes: [
      'crop-recommendation',
      'disease-diagnosis',
      'weather-chat',
      'general-chat',
      'translation'
    ]
  });
}