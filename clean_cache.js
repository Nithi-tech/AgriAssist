const fs = require('fs');
const path = require('path');

function deleteDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`Deleted: ${dirPath}`);
  } else {
    console.log(`Directory not found: ${dirPath}`);
  }
}

// Delete .next directory in firestudio
const nextDir = path.join(__dirname, 'firestudio', '.next');
deleteDirectory(nextDir);

console.log('Cache cleared successfully!');
