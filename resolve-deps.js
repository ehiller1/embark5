// resolve-deps.js
// This script resolves dependency issues by replacing problematic dependencies
// with local fallbacks

const fs = require('fs');
const path = require('path');

// Function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Create node_modules directory if it doesn't exist
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  fs.mkdirSync(nodeModulesPath, { recursive: true });
}

// Copy local fallback for three-bmfont-text
const localThreeBmfontTextPath = path.join(__dirname, 'local-deps', 'three-bmfont-text');
const targetThreeBmfontTextPath = path.join(nodeModulesPath, 'three-bmfont-text');

if (fs.existsSync(localThreeBmfontTextPath)) {
  console.log('Installing local fallback for three-bmfont-text...');
  copyDir(localThreeBmfontTextPath, targetThreeBmfontTextPath);
  console.log('Local fallback for three-bmfont-text installed successfully!');
} else {
  console.error('Local fallback for three-bmfont-text not found!');
}

console.log('Dependency resolution completed!');
