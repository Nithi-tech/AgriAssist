import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

// Configure SendGrid if API key is provided
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Send email using SendGrid (preferred) or SMTP fallback
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @param {string} options.from - Sender email (optional)
 */
export const sendEmail = async ({ to, subject, text, html, from = process.env.ADMIN_EMAIL }) => {
  try {
    // Try SendGrid first
    if (process.env.SENDGRID_API_KEY) {
      console.log('Sending email via SendGrid...');
      
      const msg = {
        to,
        from: from || process.env.ADMIN_EMAIL,
        subject,
        text,
        html: html || text
      };

      const result = await sgMail.send(msg);
      console.log('SendGrid email sent successfully');
      return { success: true, provider: 'sendgrid', result };
    }

    // Fallback to SMTP if configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      console.log('Sending email via SMTP...');
      
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const result = await transporter.sendMail({
        from: from || process.env.SMTP_USER,
        to,
        subject,
        text,
        html: html || text
      });

      console.log('SMTP email sent successfully');
      return { success: true, provider: 'smtp', result };
    }

    // No email provider configured
    console.warn('No email provider configured. Email not sent.');
    return { 
      success: false, 
      error: 'No email provider configured',
      provider: 'none' 
    };

  } catch (error) {
    console.error('Email sending failed:', error);
    return { 
      success: false, 
      error: error.message,
      provider: process.env.SENDGRID_API_KEY ? 'sendgrid' : 'smtp'
    };
  }
};

/**
 * Send contact form notification email to admin
 */
export const sendContactNotification = async ({ name, email, message, language }) => {
  const subject = `New Contact Message from AgriAssist - ${name}`;
  
  const text = `
New contact message received from AgriAssist:

Name: ${name}
Email: ${email}
Language: ${language}
Message: ${message}

Received at: ${new Date().toLocaleString()}
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">New Contact Message from AgriAssist</h2>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Language:</strong> ${language}</p>
        <p><strong>Message:</strong></p>
        <div style="background: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
          ${message.replace(/\n/g, '<br>')}
        </div>
      </div>
      <p style="color: #6b7280; font-size: 14px;">
        Received at: ${new Date().toLocaleString()}
      </p>
    </div>
  `;

  return await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject,
    text,
    html
  });
};

/**
 * Send feedback notification email to admin
 */
export const sendFeedbackNotification = async ({ message, contactEmail, optIn }) => {
  const subject = 'New Feedback - AgriAssist';
  
  const text = `
New feedback received from AgriAssist:

Feedback: ${message}
${contactEmail ? `Contact Email: ${contactEmail}` : 'No contact email provided'}
${optIn ? 'User opted in to be contacted' : 'User did not opt in to be contacted'}

Received at: ${new Date().toLocaleString()}
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">New Feedback - AgriAssist</h2>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Feedback:</strong></p>
        <div style="background: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        ${contactEmail ? `<p style="margin-top: 15px;"><strong>Contact Email:</strong> <a href="mailto:${contactEmail}">${contactEmail}</a></p>` : '<p style="margin-top: 15px;"><strong>Contact Email:</strong> Not provided</p>'}
        <p><strong>Opt-in for contact:</strong> ${optIn ? 'Yes' : 'No'}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">
        Received at: ${new Date().toLocaleString()}
      </p>
    </div>
  `;

  return await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject,
    text,
    html
  });
};
