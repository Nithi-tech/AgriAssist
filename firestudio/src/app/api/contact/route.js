import { NextRequest, NextResponse } from 'next/server';
import { sendContactNotification } from '@/utils/email';
import { sendContactSMS } from '@/utils/sms';
import { saveContactMessage } from '@/utils/storage';

// Configure route for dynamic rendering
export const dynamic = 'force-dynamic';

// Rate limiting (simple in-memory store - in production, use Redis)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute per IP

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
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const { name, email, message, language = 'en' } = body;

    // Input validation
    const errors = {};
    
    if (!name || typeof name !== 'string' || name.trim().length < 1) {
      errors.name = 'Name is required';
    } else if (name.trim().length > 100) {
      errors.name = 'Name must be less than 100 characters';
    }
    
    if (!email || typeof email !== 'string') {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!message || typeof message !== 'string' || message.trim().length < 1) {
      errors.message = 'Message is required';
    } else if (message.trim().length > 2000) {
      errors.message = 'Message must be less than 2000 characters';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      language: language.trim()
    };

    console.log('Processing contact form submission:', { name: sanitizedData.name, email: sanitizedData.email, language: sanitizedData.language });

    // Save to storage (Firestore or file fallback)
    const storageResult = await saveContactMessage(sanitizedData);
    if (!storageResult.success) {
      console.error('Failed to save contact message:', storageResult.error);
      // Continue processing even if storage fails
    }

    // Send email notification
    let emailResult = { success: false, error: 'No email provider configured' };
    if (process.env.ADMIN_EMAIL) {
      emailResult = await sendContactNotification(sanitizedData);
      if (!emailResult.success) {
        console.error('Failed to send email notification:', emailResult.error);
      }
    }

    // Send SMS notification (optional)
    let smsResult = { success: false, configured: false };
    if (process.env.NOTIFY_PHONE) {
      smsResult = await sendContactSMS(sanitizedData);
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
          error: 'Failed to process your message. Please try again or contact us directly.' 
        },
        { status: 500 }
      );
    }

    // Return success response with details
    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      details: {
        saved: storageResult.success,
        emailSent: emailResult.success,
        smsSent: smsResult.success,
        smsConfigured: smsResult.configured
      }
    });

  } catch (error) {
    console.error('Contact API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred. Please try again.' 
      },
      { status: 500 }
    );
  }
}
