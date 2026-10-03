const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const publicDir = path.join(rootDir, 'public');

console.log('[Build] Preparing output directory "public" for deployment...');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy HTML files
const htmlFiles = [
  'index.html',
  'book.html',
  'property.html',
  'listings.html',
  'about.html',
  'contact.html'
];

htmlFiles.forEach(file => {
  const src = path.join(rootDir, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
});

// Copy asset directories
const dirsToCopy = ['css', 'js', 'assets', 'data'];

dirsToCopy.forEach(dir => {
  const srcDir = path.join(rootDir, dir);
  const destDir = path.join(publicDir, dir);
  if (fs.existsSync(srcDir)) {
    fs.cpSync(srcDir, destDir, { recursive: true, force: true });
  }
});

// Copy optional root files if present
['metadata.json', 'robots.txt', 'favicon.ico'].forEach(file => {
  const src = path.join(rootDir, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
});

console.log('[Build] Complete: Output directory "public" generated successfully with all pages and assets.');
process.exit(0);
