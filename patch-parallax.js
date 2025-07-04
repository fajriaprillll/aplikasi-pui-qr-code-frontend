const fs = require('fs');
const path = require('path');

// Paths
const originalFile = path.join(__dirname, 'node_modules', 'react-parallax', '@types', 'index.ts');
const patchedFile = path.join(__dirname, 'node_modules', 'react-parallax', '@types', 'patched', 'index.ts');
const backupFile = path.join(__dirname, 'node_modules', 'react-parallax', '@types', 'index.ts.bak');

// Create backup if it doesn't exist
if (!fs.existsSync(backupFile)) {
  console.log('Creating backup of original file...');
  fs.copyFileSync(originalFile, backupFile);
}

// Replace the original file with our patched version
console.log('Applying patch...');
fs.copyFileSync(patchedFile, originalFile);

console.log('Patch applied successfully!'); 