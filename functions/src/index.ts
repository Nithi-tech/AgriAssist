// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import * as express from 'express';
import * as cors from 'cors';

// Initialize Firebase Admin SDK
admin.initializeApp();

const app = express();

// Enable CORS for all routes
app.use(cors({ origin: true }));
app.use(express.json());

// Get shared secret from Firebase Functions config
// Set via: firebase functions:config:set esp32.shared_secret="your-secret-here"
const ESP32_SHARED_SECRET = functions.config().esp32?.shared_secret || process.env.ESP32_SHARED_SECRET;

if (!ESP32_SHARED_SECRET) {
  console.error('ESP32_SHARED_SECRET not configured. Set via firebase functions:config:set esp32.shared_secret="your-secret"');
}

/**
 * Verify HMAC-SHA256 signature from ESP32 device
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // Remove 'sha256=' prefix if present
  const cleanSignature = signature.replace(/^sha256=/, '');
  
  return crypto.timingSafeEqual(
    Buffer.from(computedSignature, 'hex'),
    Buffer.from(cleanSignature, 'hex')
  );
}

/**
 * Validate sensor reading payload structure
 */
function validateSensorReading(data: any): boolean {
  return (
    data &&
    typeof data.ph === 'number' &&
    typeof data.moisture === 'number' &&
    typeof data.deviceId === 'string' &&
    data.npk &&
    typeof data.npk.n === 'number' &&
    typeof data.npk.p === 'number' &&
    typeof data.npk.k === 'number' &&
    // Location is optional
    (data.location === undefined || 
      (typeof data.location.lat === 'number' && typeof data.location.lng === 'number'))
  );
}

/**
 * ESP32 sensor data ingestion endpoint
 * POST /ingest
 * Headers: x-esp32-signature (HMAC-SHA256)
 * Body: JSON sensor reading
 */
app.post('/ingest', async (req, res) => {
  try {
    // Check if secret is configured
    if (!ESP32_SHARED_SECRET) {
      console.error('ESP32_SHARED_SECRET not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Shared secret not configured'
      });
    }

    // Get signature from header
    const signature = req.headers['x-esp32-signature'] as string;
    if (!signature) {
      console.warn('Missing x-esp32-signature header');
      return res.status(401).json({ 
        error: 'Unauthorized',
        details: 'Missing signature header'
      });
    }

    // Verify signature
    const payload = JSON.stringify(req.body);
    if (!verifySignature(payload, signature, ESP32_SHARED_SECRET)) {
      console.warn('Invalid signature for payload:', payload.substring(0, 100));
      return res.status(401).json({ 
        error: 'Unauthorized',
        details: 'Invalid signature'
      });
    }

    // Validate payload structure
    if (!validateSensorReading(req.body)) {
      console.warn('Invalid sensor reading structure:', req.body);
      return res.status(400).json({ 
        error: 'Bad Request',
        details: 'Invalid sensor reading format',
        expected: {
          ph: 'number',
          moisture: 'number',
          deviceId: 'string',
          npk: { n: 'number', p: 'number', k: 'number' },
          location: { lat: 'number', lng: 'number' } // optional
        }
      });
    }

    // Prepare document for Firestore
    const sensorReading = {
      ...req.body,
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Write to Firestore
    const docRef = await admin
      .firestore()
      .collection('sensorReadings')
      .add(sensorReading);

    console.log(`Sensor reading stored with ID: ${docRef.id} from device: ${req.body.deviceId}`);

    // Return success response
    res.status(201).json({ 
      ok: true, 
      id: docRef.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing sensor reading:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: 'Failed to process sensor reading'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'smart-farming-ingest'
  });
});

// Export the Express app as a Firebase Cloud Function
export const api = functions.https.onRequest(app);
