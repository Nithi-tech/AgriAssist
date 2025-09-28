// A Genkit flow to provide conversational weather updates.

'use server';

/**
 * @fileOverview Weather chat AI agent.
 *
 * - chatWithWeatherBot - A function that handles the weather chat process.
 * - WeatherChatInput - The input type for the chatWithWeatherBot function.
 * - WeatherChatOutput - The return type for the chatWithWeatherBot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const WeatherChatInputSchema = z.object({
  query: z.string().describe('The user\'s question about the weather.'),
});
export type WeatherChatInput = z.infer<typeof WeatherChatInputSchema>;

const WeatherChatOutputSchema = z.object({
  response: z.string().describe('The chatbot\'s response to the user\'s query.'),
});
export type WeatherChatOutput = z.infer<typeof WeatherChatOutputSchema>;


const getWeather = ai.defineTool(
  {
    name: 'getWeather',
    description: 'Returns the current weather and forecast for a given city.',
    inputSchema: z.object({
      city: z.string().describe('The city to get the weather for.'),
    }),
    outputSchema: z.object({
        temperature: z.number().describe('The current temperature in Celsius.'),
        description: z.string().describe('A brief description of the weather.'),
        humidity: z.number().describe('The humidity percentage.'),
        windSpeed: z.number().describe('The wind speed in km/h.'),
        feelsLike: z.number().describe('The feels like temperature in Celsius.'),
        forecast: z.array(z.object({
          date: z.string().describe('The forecast date.'),
          maxTemp: z.number().describe('Maximum temperature for the day.'),
          minTemp: z.number().describe('Minimum temperature for the day.'),
          condition: z.string().describe('Weather condition description.'),
          rainChance: z.number().describe('Chance of rain percentage.'),
        })).describe('7-day weather forecast.'),
    }),
  },
  async (input) => {
    try {
      // Call our internal weather API instead of external service
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/weather?q=${encodeURIComponent(input.city)}&days=7`);
      
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
      console.error('Weather API Error in chatbot:', error);
      throw new Error(`I'm having trouble fetching live weather data right now: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);


export async function chatWithWeatherBot(input: WeatherChatInput): Promise<WeatherChatOutput> {
  return chatWithWeatherBotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'weatherChatPrompt',
  input: {schema: WeatherChatInputSchema},
  output: {schema: WeatherChatOutputSchema},
  model: 'googleai/gemini-1.5-flash',
  tools: [getWeather],
  prompt: `You are a friendly weather assistant. Your goal is to answer the user's questions about the weather.
  
  If you have the information, answer the user's question: {{{query}}}
  
  If you do not have the information, use the provided tools to find it. Do not make up information.
  If the user's query is not about weather, politely decline the request.
  `,
});

const chatWithWeatherBotFlow = ai.defineFlow(
  {
    name: 'chatWithWeatherBotFlow',
    inputSchema: WeatherChatInputSchema,
    outputSchema: WeatherChatOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
