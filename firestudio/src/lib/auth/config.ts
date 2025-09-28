// Environment configuration for authentication services
export const AUTH_CONFIG = {
  // Firebase Configuration
  FIREBASE: {
    PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
    PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
    DATABASE_URL: process.env.FIREBASE_DATABASE_URL || '',
  },
  
  // Twilio Configuration
  TWILIO: {
    ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
    AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
    FROM_NUMBER: process.env.TWILIO_FROM_NUMBER || '',
    SERVICE_SID: process.env.TWILIO_SERVICE_SID || '', // For Verify API
  },
  
  // Supabase Configuration
  SUPABASE: {
    URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  
  // OTP Configuration
  OTP: {
    LENGTH: 6,
    EXPIRY_MINUTES: 5,
    MAX_ATTEMPTS: 3,
    RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS_PER_WINDOW: 3,
  },
  
  // Security Configuration
  SECURITY: {
    JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-key',
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'your-32-char-encryption-key',
    HMAC_SECRET: process.env.HMAC_SECRET || 'your-hmac-secret-key',
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // Debug Configuration
  DEBUG: {
    ENABLED: process.env.NODE_ENV === 'development',
    LOG_LEVEL: process.env.DEBUG_LOG_LEVEL || 'info',
    MOCK_SMS: process.env.MOCK_SMS === 'true',
    TEST_OTP: process.env.TEST_OTP || '123456',
  },
  
  // Application Configuration
  APP: {
    NAME: 'FireStudio',
    ENVIRONMENT: process.env.NODE_ENV || 'development',
    BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    API_VERSION: 'v1',
  }
};

// Validation function to check if required environment variables are set
export function validateConfig(): { isValid: boolean; missingVars: string[] } {
  const required = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_FROM_NUMBER',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET'
  ];
  
  const missingVars: string[] = [];
  
  for (const varName of required) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

// Provider selection logic
export function getPreferredProvider(): 'firebase' | 'twilio' {
  // Check if Firebase is properly configured
  const firebaseConfigured = AUTH_CONFIG.FIREBASE.PROJECT_ID && 
                            AUTH_CONFIG.FIREBASE.PRIVATE_KEY && 
                            AUTH_CONFIG.FIREBASE.CLIENT_EMAIL;
  
  // Check if Twilio is properly configured
  const twilioConfigured = AUTH_CONFIG.TWILIO.ACCOUNT_SID && 
                          AUTH_CONFIG.TWILIO.AUTH_TOKEN && 
                          AUTH_CONFIG.TWILIO.FROM_NUMBER;
  
  // Prefer Firebase, fallback to Twilio
  if (firebaseConfigured) {
    return 'firebase';
  } else if (twilioConfigured) {
    return 'twilio';
  } else {
    console.warn('Neither Firebase nor Twilio is properly configured');
    return 'firebase'; // Default fallback
  }
}

// Configuration for different environments
export const ENV_CONFIG = {
  development: {
    ...AUTH_CONFIG,
    DEBUG: {
      ...AUTH_CONFIG.DEBUG,
      ENABLED: true,
      MOCK_SMS: true,
    }
  },
  
  production: {
    ...AUTH_CONFIG,
    DEBUG: {
      ...AUTH_CONFIG.DEBUG,
      ENABLED: false,
      MOCK_SMS: false,
    }
  },
  
  test: {
    ...AUTH_CONFIG,
    OTP: {
      ...AUTH_CONFIG.OTP,
      EXPIRY_MINUTES: 1, // Shorter for tests
    },
    DEBUG: {
      ...AUTH_CONFIG.DEBUG,
      ENABLED: true,
      MOCK_SMS: true,
      TEST_OTP: '123456',
    }
  }
};

// Get configuration for current environment
export function getConfig() {
  const env = process.env.NODE_ENV || 'development';
  return ENV_CONFIG[env as keyof typeof ENV_CONFIG] || ENV_CONFIG.development;
}
