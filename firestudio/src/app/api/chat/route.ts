import {NextRequest, NextResponse} from 'next/server';

// Configure route for dynamic rendering
export const dynamic = 'force-dynamic';

// Language detection helper
function detectLanguage(text: string): string {
  // Simple language detection based on common patterns
  if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Hindi
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te'; // Telugu
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml'; // Malayalam
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'; // Kannada
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu'; // Gujarati
  if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali
  if (/[\u0900-\u097F]/.test(text)) return 'mr'; // Marathi (overlaps with Hindi)
  if (/[\u0600-\u06FF]/.test(text)) return 'ur'; // Urdu
  return 'en'; // Default to English
}

// Get farming-focused system prompt in the target language
function getFarmingSystemPrompt(language: string): string {
  const prompts: Record<string, string> = {
    en: `You are AgriAssist, an expert AI farming assistant specializing in Indian agriculture. 
         Provide helpful, accurate, and practical advice on:
         - Crop recommendations based on soil, weather, and region
         - Disease diagnosis and treatment solutions
         - Weather-based farming guidance
         - Government schemes and subsidies for farmers
         - Sustainable farming practices
         - Market prices and timing
         
         Always respond in a friendly, supportive manner. Keep responses concise but informative.
         If asked about non-farming topics, politely redirect to agricultural matters.`,
    
    hi: `आप AgriAssist हैं, भारतीय कृषि में विशेषज्ञ एक AI कृषि सहायक। 
         निम्नलिखित पर सहायक, सटीक और व्यावहारिक सलाह प्रदान करें:
         - मिट्टी, मौसम और क्षेत्र के आधार पर फसल की सिफारिशें
         - रोग निदान और उपचार समाधान
         - मौसम आधारित खेती मार्गदर्शन
         - किसानों के लिए सरकारी योजनाएं और सब्सिडी
         - टिकाऊ खेती प्रथाएं
         - बाजार की कीमतें और समय
         
         हमेशा मित्रवत, सहायक तरीके से जवाब दें। जवाब संक्षिप्त लेकिन जानकारीपूर्ण रखें।`,
    
    ta: `நீங்கள் AgriAssist, இந்தியக் கृஷிਯில் நிபுணத்துவம் பெற்ற AI வேளாண்மை உதவியாளர்.
         பின்வருவனவற்றில் உதவிகரமான, துல்லியமான மற்றும் நடைமுறை ஆலோசனைகளை வழங்குங்கள்:
         - மண், வானிலை மற்றும் பிராந்தியத்தின் அடிப்படையில் பயிர் பரிந்துரைகள்
         - நோய் கண்டறிதல் மற்றும் சிகிச்சை தீர்வுகள்
         - வானிலை அடிப்படையிலான வேளாண்மை வழிகாட்டுதல்
         - விவசாயிகளுக்கான அரசு திட்டங்கள் மற்றும் மானியங்கள்
         - நிலையான வேளாண்மை நடைமுறைகள்
         
         எப்போதும் நட்புரீதியான, ஆதரவான முறையில் பதிலளிக்கவும்.`
  };
  
  return prompts[language] || prompts['en'];
}

export async function POST(req: NextRequest) {
  try {
    const { message, language = 'en', history = [] } = await req.json();

    if (!message) {
      return NextResponse.json({error: 'Message is required'}, {status: 400});
    }



    // Detect language if not provided
    const detectedLanguage = detectLanguage(message);
    const responseLanguage = language || detectedLanguage;

    // Build conversation context
    const systemPrompt = getFarmingSystemPrompt(responseLanguage);
    
    // Format conversation history for context
    const conversationContext = history.slice(-5).map((msg: any) => {
      const role = msg.sender === 'user' ? 'user' : 'assistant';
      return {
        role,
        parts: [{text: msg.content}]
      };
    });

    // Add system prompt and current message
    const contents = [
      {
        role: 'user',
        parts: [{text: systemPrompt}]
      },
      ...conversationContext,
      {
        role: 'user',
        parts: [{text: `${message}\n\nPlease respond in ${responseLanguage === 'en' ? 'English' : 'the same language as the question'}.`}]
      }
    ];

    // Forward to unified Gemini API instead of making direct API call
    const geminiRequest = {
      type: 'general-chat',
      message: message,
      language: responseLanguage,
      history: history
    };

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const geminiResponse = await fetch(`${baseUrl}/api/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequest),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(errorData, { status: geminiResponse.status });
    }

    const result = await geminiResponse.json();
    const reply = result.data?.response || 'Sorry, I could not get a response.';

    return NextResponse.json({
      response: reply,
      detectedLanguage,
      responseLanguage
    });
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json({error: error.message || 'An internal server error occurred'}, {status: 500});
  }
}
