import { NextRequest, NextResponse } from 'next/server';
import { sendFeedbackNotification } from '@/utils/email';
import { sendFeedbackSMS } from '@/utils/sms';
import { saveFeedback } from '@/utils/storage';

// Configure route for dynamic rendering
export const dynamic = 'force-dynamic';

// Rate limiting (simple in-memory store)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 3; // 3 feedback submissions per minute per IP

const checkRateLimit = (ip) => {
  const now = Date.now();
  const userRequests = rateLimitStore.get(ip) || [];
  
  // Remove old requests outside the time window
  const validRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  validRequests.push(now);
  rateLimitStore.set(ip, validRequests);
  return true;
};

export async function POST(req) {
  try {
    // Rate limiting
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many feedback submissions. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const { message, contactEmail, optIn = false } = body;

    // Input validation
    const errors = {};
    
    if (!message || typeof message !== 'string' || message.trim().length < 1) {
      errors.message = 'Feedback message is required';
    } else if (message.trim().length > 2000) {
      errors.message = 'Feedback must be less than 2000 characters';
    }

    // Validate email if provided
    if (contactEmail && typeof contactEmail === 'string' && contactEmail.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
        errors.contactEmail = 'Please enter a valid email address';
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      message: message.trim(),
      contactEmail: contactEmail ? contactEmail.trim().toLowerCase() : null,
      optIn: Boolean(optIn)
    };

    console.log('Processing feedback submission:', { 
      hasContactEmail: !!sanitizedData.contactEmail, 
      optIn: sanitizedData.optIn 
    });

    // Save to storage (Firestore or file fallback)
    const storageResult = await saveFeedback(sanitizedData);
    if (!storageResult.success) {
      console.error('Failed to save feedback:', storageResult.error);
      // Continue processing even if storage fails
    }

    // Send email notification
    let emailResult = { success: false, error: 'No email provider configured' };
    if (process.env.ADMIN_EMAIL) {
      emailResult = await sendFeedbackNotification(sanitizedData);
      if (!emailResult.success) {
        console.error('Failed to send email notification:', emailResult.error);
      }
    }

    // Send SMS notification (optional)
    let smsResult = { success: false, configured: false };
    if (process.env.NOTIFY_PHONE) {
      smsResult = await sendFeedbackSMS();
      if (!smsResult.success && smsResult.configured) {
        console.error('Failed to send SMS notification:', smsResult.error);
      }
    }

    // Determine success based on at least one notification method working
    const overallSuccess = storageResult.success || emailResult.success;

    if (!overallSuccess) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to process your feedback. Please try again or contact us directly.' 
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      details: {
        saved: storageResult.success,
        emailSent: emailResult.success,
        smsSent: smsResult.success,
        smsConfigured: smsResult.configured
      }
    });

  } catch (error) {
    console.error('Feedback API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred. Please try again.' 
      },
      { status: 500 }
    );
  }
}
