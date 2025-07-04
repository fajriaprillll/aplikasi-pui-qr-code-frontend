// Script to fix ReactNode import in react-parallax
const fs = require('fs');
const path = require('path');

try {
  const filePath = path.join(process.cwd(), 'node_modules', 'react-parallax', '@types', 'index.ts');
  
  if (fs.existsSync(filePath)) {
    console.log(`Found file: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the problematic import with the fixed import
    const fixed = content.replace(
      'import React, { ReactNode } from \'react\';',
      'import React from \'react\';\nimport type { ReactNode } from \'react\';'
    );
    
    fs.writeFileSync(filePath, fixed);
    console.log('Successfully fixed ReactNode import in react-parallax');
  } else {
    console.log(`File not found: ${filePath}`);
  }
} catch (error) {
  console.error('Error fixing react-parallax:', error);
} 