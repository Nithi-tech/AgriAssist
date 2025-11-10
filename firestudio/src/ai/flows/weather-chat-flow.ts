// Weather chat client that calls the secure API route

'use server';

/**
 * @fileOverview Weather chat client.
 *
 * - chatWithWeatherBot - A function that handles the weather chat process.
 * - WeatherChatInput - The input type for the chatWithWeatherBot function.
 * - WeatherChatOutput - The return type for the chatWithWeatherBot function.
 */

import {z} from 'zod';

const WeatherChatInputSchema = z.object({
  query: z.string().describe('The user\'s question about the weather.'),
  language: z.string().optional().describe('Language for the response'),
});
export type WeatherChatInput = z.infer<typeof WeatherChatInputSchema>;

const WeatherChatOutputSchema = z.object({
  response: z.string().describe('The chatbot\'s response to the user\'s query.'),
});
export type WeatherChatOutput = z.infer<typeof WeatherChatOutputSchema>;

/**
 * Helper function to fetch weather data
 */
async function getWeatherData(city: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const response = await fetch(`${baseUrl}/api/weather?q=${encodeURIComponent(city)}&days=7`);
    
    if (!response.ok) {
      throw new Error(`Weather API responded with status: ${response.status}`);
    }
    
    const weatherData = await response.json();
    
    if (weatherData.error) {
      throw new Error(weatherData.error);
    }
    
    return {
      temperature: weatherData.current.temp_c,
      description: weatherData.current.condition.text,
      humidity: weatherData.current.humidity,
      windSpeed: weatherData.current.wind_kph,
      feelsLike: weatherData.current.feelslike_c,
      forecast: weatherData.forecast.slice(0, 7).map((day: any) => ({
        date: day.date,
        maxTemp: day.maxtemp_c,
        minTemp: day.mintemp_c,
        condition: day.condition.text,
        rainChance: day.daily_chance_of_rain,
      })),
    };
  } catch (error) {
    console.error('Weather API Error:', error);
    return null;
  }
}

/**
 * Chat with weather bot by calling the secure API route
 * This ensures the API key is never exposed to the frontend
 */
export async function chatWithWeatherBot(input: WeatherChatInput): Promise<WeatherChatOutput> {
  try {
    console.log('Starting weather chat with query:', input.query);
    
    // Validate input
    const validatedInput = WeatherChatInputSchema.parse(input);
    
    // Try to extract city from the query for weather data
    let weatherData = null;
    const cityMatch = validatedInput.query.match(/weather.*?(?:in|for|at)\s+([a-zA-Z\s]+)/i) || 
                     validatedInput.query.match(/([a-zA-Z\s]+)\s+weather/i);
    
    if (cityMatch) {
      const city = cityMatch[1].trim();
      console.log('Extracted city:', city);
      weatherData = await getWeatherData(city);
    }
    
    // Get the base URL for the API call
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    console.log('Calling weather chat API...');
    
    // Call the secure API route
    const response = await fetch(`${baseUrl}/api/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'weather-chat',
        query: validatedInput.query,
        weatherData: weatherData,
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
      
      let errorMessage = 'Failed to get weather chat response';
      
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
      throw new Error('Invalid response from weather chat API');
    }

    console.log('Weather chat completed successfully');
    
    return {
      response: result.data.response || 'I apologize, but I could not get a response.'
    };

  } catch (error) {
    console.error('Error in weather chat:', error);
    
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.errors.map(e => e.message).join(', ')}`);
    }
    
    throw new Error(`Weather chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
