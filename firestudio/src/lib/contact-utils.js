/**
 * Contact utilities for handling phone numbers, WhatsApp links, and clipboard operations
 */

/**
 * Formats phone number to E.164 format (removes all non-digits and adds country code if needed)
 * @param {string} number - Phone number in any format
 * @returns {string} - E.164 formatted number
 */
export const formatE164 = (number) => {
  // Remove all non-digit characters
  const cleanNumber = number.replace(/\D/g, '');
  
  // If it starts with 91 (India), add +
  if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
    return `+${cleanNumber}`;
  }
  
  // If it doesn't start with country code, assume India and add +91
  if (!cleanNumber.startsWith('91') && cleanNumber.length === 10) {
    return `+91${cleanNumber}`;
  }
  
  return `+${cleanNumber}`;
};

/**
 * Formats phone number for display (with spaces)
 * @param {string} number - Phone number
 * @returns {string} - Formatted display number
 */
export const formatDisplayNumber = (number) => {
  const e164 = formatE164(number);
  // Format as +91 XXXXX XXXXX
  if (e164.startsWith('+91') && e164.length === 13) {
    return `+91 ${e164.slice(3, 8)} ${e164.slice(8)}`;
  }
  return e164;
};

/**
 * Builds WhatsApp URL with prefilled message
 * @param {string} number - Phone number
 * @param {string} name - Person's name
 * @returns {string} - WhatsApp URL
 */
export const buildWhatsAppUrl = (number, name) => {
  const e164Number = formatE164(number).replace(/\D/g, ''); // Remove + and other characters
  const message = `Hello ${name}, I am contacting you from AgriAssist. I need assistance with...`;
  return `https://wa.me/${e164Number}?text=${encodeURIComponent(message)}`;
};

/**
 * Copies text to clipboard with fallback for older browsers
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export const copyToClipboard = async (text) => {
  try {
    // Modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'absolute';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Team contact data in E.164 format for consistency
 */
export const TEAM_CONTACTS = [
  { name: "NITHIVALAVAN N", phone: "+917449062509", role: "Team Member" },
  { name: "MOHAMED ASKAR S", phone: "+917373362186", role: "Team Member" },
  { name: "NAVINKUMAR J", phone: "+919087354031", role: "Team Member" },
  { name: "BHARATHRAJ", phone: "+919443795865", role: "Team Member" },
  { name: "JAYARAJ", phone: "+918300714197", role: "Team Member" }
];

/**
 * Logs contact action for analytics (can be extended)
 * @param {string} action - Action type ('call', 'whatsapp', 'copy')
 * @param {string} contactName - Contact name
 */
export const logContactAction = (action, contactName) => {
  // For future analytics integration
  if (typeof window !== 'undefined') {
    console.log(`Contact action: ${action} for ${contactName}`);
    // Future: window.dataLayer?.push({ event: 'contact_action', action, contact: contactName });
  }
};
