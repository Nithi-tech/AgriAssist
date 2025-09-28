import { NextRequest, NextResponse } from 'next/server';
import { translateResponse } from '@/utils/translateResponse';

// Example government schemes data (simulating CSV content)
const mockSchemes = [
  {
    id: 1,
    name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    description: "Under this scheme, financial benefit of Rs 6000 per year is provided to small and marginal farmer families having combined land holding/ownership of up to 2 hectares.",
    eligibility: "Small and marginal farmers with landholding up to 2 hectares",
    benefits: "Rs 6000 per year in three equal installments",
    applicationProcess: "Apply through PM-KISAN portal or nearest Common Service Center"
  },
  {
    id: 2,
    name: "Kisan Credit Card (KCC)",
    description: "KCC provides farmers with timely access to credit for their cultivation and other needs. It also covers personal accident insurance and crop insurance.",
    eligibility: "All farmers - Owner cultivators, Tenant farmers, Oral lessees, Share croppers etc.",
    benefits: "Flexible credit limit, reduced paperwork, insurance coverage",
    applicationProcess: "Apply at any bank branch with required documents"
  },
  {
    id: 3,
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    description: "Crop insurance scheme providing financial support to farmers suffering crop loss/damage arising due to unforeseen events.",
    eligibility: "All farmers growing notified crops in notified areas",
    benefits: "Insurance coverage for crop loss due to natural calamities",
    applicationProcess: "Apply through insurance companies or banks before crop season"
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';
    const schemeId = searchParams.get('id');

    // Filter schemes if specific ID requested
    let schemes = mockSchemes;
    if (schemeId) {
      schemes = schemes.filter(scheme => scheme.id === parseInt(schemeId));
    }

    // If language is English, return original content
    if (lang === 'en') {
      return NextResponse.json({
        success: true,
        language: lang,
        schemes: schemes,
        translated: false
      });
    }

    // Translate schemes to requested language
    const translatedSchemes = await Promise.all(
      schemes.map(async (scheme) => {
        try {
          const [
            translatedName,
            translatedDescription,
            translatedEligibility,
            translatedBenefits,
            translatedApplicationProcess
          ] = await Promise.all([
            translateResponse(scheme.name, lang),
            translateResponse(scheme.description, lang),
            translateResponse(scheme.eligibility, lang),
            translateResponse(scheme.benefits, lang),
            translateResponse(scheme.applicationProcess, lang)
          ]);

          return {
            ...scheme,
            name: translatedName,
            description: translatedDescription,
            eligibility: translatedEligibility,
            benefits: translatedBenefits,
            applicationProcess: translatedApplicationProcess
          };
        } catch (error) {
          console.error(`Translation failed for scheme ${scheme.id}:`, error);
          // Return original scheme if translation fails
          return scheme;
        }
      })
    );

    return NextResponse.json({
      success: true,
      language: lang,
      schemes: translatedSchemes,
      translated: true,
      message: `Successfully translated ${translatedSchemes.length} scheme(s) to ${lang}`
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch/translate government schemes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLanguage } = body;

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { success: false, error: 'Missing text or targetLanguage' },
        { status: 400 }
      );
    }

    const translatedText = await translateResponse(text, targetLanguage);

    return NextResponse.json({
      success: true,
      originalText: text,
      translatedText,
      targetLanguage,
      translated: targetLanguage !== 'en'
    });

  } catch (error) {
    console.error('Translation API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to translate text',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
