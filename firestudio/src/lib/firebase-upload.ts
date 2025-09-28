import { ref, uploadBytes, getDownloadURL, type StorageReference } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from './firebase';

export interface UploadResult {
  downloadURL: string;
  storageRef: string;
  firestoreDocId: string;
}

export async function uploadImageToFirebase(file: File, folderPath: string = 'disease_diagnosis'): Promise<UploadResult> {
  try {
    // Generate unique filename with timestamp and random string
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}_${randomString}_${file.name}`;
    
    // Create storage reference
    const storageRef: StorageReference = ref(storage, `${folderPath}/${fileName}`);
    
    // Upload file to Firebase Storage
    const uploadResult = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    // Store metadata in Firestore
    const docRef = await addDoc(collection(db, 'disease_diagnosis_uploads'), {
      fileName: file.name,
      originalName: file.name,
      downloadURL,
      storageRef: storageRef.fullPath,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: serverTimestamp(),
      processed: false,
      metadata: {
        capturedFromCamera: file.name.includes('captured-leaf'),
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    });
    
    return {
      downloadURL,
      storageRef: storageRef.fullPath,
      firestoreDocId: docRef.id
    };
  } catch (error) {
    console.error('Error uploading to Firebase:', error);
    throw new Error('Failed to upload image to Firebase Storage');
  }
}
