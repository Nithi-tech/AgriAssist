import twilio from 'twilio';

let client = null;

// Initialize Twilio client if credentials are provided
if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Send SMS notification using Twilio
 * @param {Object} options - SMS options
 * @param {string} options.to - Recipient phone number
 * @param {string} options.message - SMS message content
 * @param {string} options.from - Sender phone number (optional, uses TWILIO_NUMBER env)
 */
export const sendSMS = async ({ to, message, from = process.env.TWILIO_NUMBER }) => {
  try {
    if (!client) {
      console.warn('Twilio not configured. SMS not sent.');
      return { 
        success: false, 
        error: 'Twilio not configured',
        configured: false 
      };
    }

    if (!from) {
      console.error('No Twilio phone number configured');
      return { 
        success: false, 
        error: 'No Twilio phone number configured',
        configured: true 
      };
    }

    console.log('Sending SMS via Twilio...');
    
    const result = await client.messages.create({
      body: message,
      from: from,
      to: to
    });

    console.log('SMS sent successfully:', result.sid);
    return { success: true, messageId: result.sid, configured: true };

  } catch (error) {
    console.error('SMS sending failed:', error);
    return { 
      success: false, 
      error: error.message,
      configured: !!client 
    };
  }
};

/**
 * Send contact notification SMS to admin
 */
export const sendContactSMS = async ({ name, email }) => {
  const message = `New AgriAssist contact from ${name} (${email}). Check admin email for details.`;
  
  return await sendSMS({
    to: process.env.NOTIFY_PHONE,
    message: message.substring(0, 160) // SMS character limit
  });
};

/**
 * Send feedback notification SMS to admin
 */
export const sendFeedbackSMS = async () => {
  const message = 'New feedback received on AgriAssist. Check admin email for details.';
  
  return await sendSMS({
    to: process.env.NOTIFY_PHONE,
    message
  });
};
