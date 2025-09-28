import fs from 'fs';
import path from 'path';

// Create data directory if it doesn't exist
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Save data to JSON file as fallback when Firestore is not available
 * @param {string} filename - JSON filename (e.g., 'messages.json')
 * @param {Object} data - Data to save
 */
const saveToFile = async (filename, data) => {
  try {
    const filePath = path.join(dataDir, filename);
    let existingData = [];

    // Read existing data if file exists
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      if (fileContent.trim()) {
        existingData = JSON.parse(fileContent);
      }
    }

    // Add new data with timestamp
    const newEntry = {
      ...data,
      createdAt: new Date().toISOString(),
      id: Date.now().toString()
    };

    existingData.push(newEntry);

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
    console.log(`Data saved to ${filename}`);
    
    return { success: true, id: newEntry.id };
  } catch (error) {
    console.error(`Failed to save to ${filename}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Save contact message to storage
 * @param {Object} messageData - Contact message data
 */
export const saveContactMessage = async (messageData) => {
  // TODO: Implement Firestore saving when Firebase is fully configured
  // For now, using file fallback
  
  // if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
  //   try {
  //     const { initializeApp, getApps, cert } = await import('firebase-admin/app');
  //     const { getFirestore } = await import('firebase-admin/firestore');
  
  //     if (!getApps().length) {
  //       initializeApp({
  //         credential: cert({
  //           projectId: process.env.FIREBASE_PROJECT_ID,
  //           clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  //           privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  //         }),
  //       });
  //     }
  
  //     const db = getFirestore();
  //     const docRef = await db.collection('messages').add({
  //       ...messageData,
  //       source: 'contact_form',
  //       createdAt: new Date(),
  //     });
  
  //     console.log('Contact message saved to Firestore:', docRef.id);
  //     return { success: true, id: docRef.id, storage: 'firestore' };
  //   } catch (error) {
  //     console.error('Firestore save failed, falling back to file:', error);
  //   }
  // }

  // Fallback to file storage
  const result = await saveToFile('messages.json', {
    ...messageData,
    source: 'contact_form'
  });
  
  return { ...result, storage: 'file' };
};

/**
 * Save feedback to storage
 * @param {Object} feedbackData - Feedback data
 */
export const saveFeedback = async (feedbackData) => {
  // TODO: Implement Firestore saving when Firebase is fully configured
  // For now, using file fallback
  
  // Similar Firestore implementation as above but for 'feedback' collection

  // Fallback to file storage
  const result = await saveToFile('feedback.json', {
    ...feedbackData,
    source: 'feedback_form'
  });
  
  return { ...result, storage: 'file' };
};

/**
 * Get all messages (for admin purposes)
 * @param {number} limit - Maximum number of messages to return
 */
export const getMessages = async (limit = 50) => {
  try {
    const filePath = path.join(dataDir, 'messages.json');
    if (!fs.existsSync(filePath)) {
      return { success: true, data: [], storage: 'file' };
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Return most recent messages first
    const sortedData = data
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    return { success: true, data: sortedData, storage: 'file' };
  } catch (error) {
    console.error('Failed to get messages:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all feedback (for admin purposes)
 * @param {number} limit - Maximum number of feedback entries to return
 */
export const getFeedback = async (limit = 50) => {
  try {
    const filePath = path.join(dataDir, 'feedback.json');
    if (!fs.existsSync(filePath)) {
      return { success: true, data: [], storage: 'file' };
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Return most recent feedback first
    const sortedData = data
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    return { success: true, data: sortedData, storage: 'file' };
  } catch (error) {
    console.error('Failed to get feedback:', error);
    return { success: false, error: error.message };
  }
};
