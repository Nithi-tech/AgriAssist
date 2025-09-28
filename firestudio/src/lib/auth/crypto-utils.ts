import crypto from 'crypto';

/**
 * Generate a secure random OTP
 */
export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    otp += digits[randomIndex];
  }
  
  return otp;
}

/**
 * Hash OTP for secure storage
 */
export function hashOTP(otp: string, salt?: string): { hash: string; salt: string } {
  const otpSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(otp, otpSalt, 10000, 64, 'sha512').toString('hex');
  
  return { hash, salt: otpSalt };
}

/**
 * Verify OTP against hash
 */
export function verifyOTPHash(otp: string, hash: string, salt: string): boolean {
  const otpHash = crypto.pbkdf2Sync(otp, salt, 10000, 64, 'sha512').toString('hex');
  return hash === otpHash;
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a secure verification ID
 */
export function generateVerificationId(): string {
  return crypto.randomUUID();
}

/**
 * Hash phone number for privacy
 */
export function hashPhoneNumber(phoneNumber: string): string {
  return crypto.createHash('sha256').update(phoneNumber).digest('hex');
}

/**
 * Encrypt sensitive data
 */
export function encryptData(data: string, key?: string): { encrypted: string; key: string; iv: string } {
  const encryptionKey = key || crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted,
    key: Buffer.from(encryptionKey).toString('hex'),
    iv: iv.toString('hex')
  };
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string, key: string, iv: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', Buffer.from(key, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Time-safe string comparison to prevent timing attacks
 */
export function timeSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  
  return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * Generate HMAC signature
 */
export function generateHMAC(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifyHMAC(data: string, signature: string, secret: string): boolean {
  const expectedSignature = generateHMAC(data, secret);
  return timeSafeEqual(signature, expectedSignature);
}

/**
 * Generate a secure API key
 */
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Create a secure hash of user credentials
 */
export function createUserHash(phoneNumber: string, additionalData?: string): string {
  const data = phoneNumber + (additionalData || '');
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Validate OTP format
 */
export function isValidOTPFormat(otp: string): boolean {
  return /^\d{4,8}$/.test(otp);
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(createdAt: Date, expiryMinutes: number = 5): boolean {
  const now = new Date();
  const expiryTime = new Date(createdAt.getTime() + (expiryMinutes * 60 * 1000));
  return now > expiryTime;
}

/**
 * Generate a time-based token (for additional security)
 */
export function generateTimeBasedToken(secret: string, timeStep: number = 30): string {
  const now = Math.floor(Date.now() / 1000);
  const timeSlot = Math.floor(now / timeStep);
  
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(Buffer.from(timeSlot.toString()));
  const hash = hmac.digest();
  
  const offset = hash[hash.length - 1] & 0x0f;
  const truncated = hash.subarray(offset, offset + 4);
  const code = parseInt(truncated.toString('hex'), 16) & 0x7fffffff;
  
  return (code % 1000000).toString().padStart(6, '0');
}
