// A Node.js script to download an entire "folder" from Firebase Storage.
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// --- Start Configuration ---

// 1. Service Account Key:
// Go to your Firebase Project Settings -> Service accounts -> Generate new private key
// Save the downloaded JSON file in a secure location.
// IMPORTANT: Add this file to your .gitignore to prevent it from being checked into source control.
const serviceAccount = require('./serviceAccountKey.json'); // <-- IMPORTANT: Update this path

// 2. Firebase Storage Bucket Name:
// This is typically '<project-id>.appspot.com'. You can find it in the Firebase Console
// under Storage -> Files tab.
const bucketName = 'your-bucket-name.appspot.com'; // <-- IMPORTANT: Update this value

// 3. Folder Path in Storage:
// The path to the "folder" you want to download. Leave empty to download the whole bucket.
// e.g., 'images/profiles' or 'user-uploads'
const folderPathInStorage = 'path/to/your/folder'; // <-- IMPORTANT: Update this value

// 4. Local Destination Path:
// The local directory where files will be downloaded. It will be created if it doesn't exist.
const localDownloadPath = './firebase-downloads'; // <-- IMPORTANT: Update this value

// --- End Configuration ---

// Initialize the Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: bucketName,
  });
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    console.log('Firebase app already initialized.');
  } else {
    console.error('Error initializing Firebase Admin SDK:', error);
    process.exit(1);
  }
}

const bucket = admin.storage().bucket();

/**
 * Downloads all files from a specified folder in Firebase Storage to a local directory.
 */
async function downloadFolder() {
  console.log(
    `Starting download for folder "${folderPathInStorage}" from bucket "${bucketName}"...`
  );

  try {
    // List all files in the specified folder
    const [files] = await bucket.getFiles({ prefix: folderPathInStorage });

    if (files.length === 0) {
      console.log('No files found in the specified folder.');
      return;
    }

    console.log(`Found ${files.length} files to download.`);

    // Create a promise for each download
    const downloadPromises = files.map(async (file) => {
      // Determine the local path for the file
      const relativePath = path.relative(folderPathInStorage, file.name);
      const destinationPath = path.join(localDownloadPath, relativePath);

      // Create local directories if they don't exist
      const directoryName = path.dirname(destinationPath);
      if (!fs.existsSync(directoryName)) {
        fs.mkdirSync(directoryName, { recursive: true });
      }

      // Download the file
      try {
        await file.download({ destination: destinationPath });
        console.log(`Successfully downloaded: ${file.name}`);
      } catch (downloadError) {
        console.error(`Failed to download ${file.name}:`, downloadError);
      }
    });

    // Wait for all downloads to complete
    await Promise.all(downloadPromises);

    console.log('\n-------------------------------------');
    console.log('✅ All files have been downloaded successfully!');
    console.log(`✅ Local destination: ${path.resolve(localDownloadPath)}`);
    console.log('-------------------------------------');

  } catch (error) {
    console.error(
      'An error occurred while trying to list or download files:',
      error
    );
  }
}

// Run the script
downloadFolder();
