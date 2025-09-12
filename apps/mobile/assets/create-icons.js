/**
 * Icon Generation Script for CRYB Mobile App
 * Creates placeholder icons using Canvas API
 */

const { createCanvas } = require('canvas');
const fs = require('fs');

// CRYB Brand Colors
const COLORS = {
  primary: '#6366f1',    // indigo-500
  secondary: '#4f46e5',  // indigo-600
  background: '#000000', // black
  text: '#ffffff'        // white
};

// Create main app icon (1024x1024)
function createMainIcon() {
  const canvas = createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');
  
  // Black background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, 1024, 1024);
  
  // Create gradient circle
  const gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 400);
  gradient.addColorStop(0, COLORS.primary);
  gradient.addColorStop(1, COLORS.secondary);
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(512, 512, 350, 0, 2 * Math.PI);
  ctx.fill();
  
  // Add CRYB text
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 180px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CRYB', 512, 512);
  
  return canvas.toBuffer('image/png');
}

// Create adaptive icon (1024x1024)
function createAdaptiveIcon() {
  const canvas = createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');
  
  // Transparent background
  ctx.clearRect(0, 0, 1024, 1024);
  
  // Create gradient circle
  const gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 400);
  gradient.addColorStop(0, COLORS.primary);
  gradient.addColorStop(1, COLORS.secondary);
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(512, 512, 400, 0, 2 * Math.PI);
  ctx.fill();
  
  // Add CRYB text
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 160px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CRYB', 512, 512);
  
  return canvas.toBuffer('image/png');
}

// Create splash screen (1284x2778)
function createSplashScreen() {
  const canvas = createCanvas(1284, 2778);
  const ctx = canvas.getContext('2d');
  
  // Black background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, 1284, 2778);
  
  // Create gradient circle in center
  const centerX = 642;
  const centerY = 1389;
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 300);
  gradient.addColorStop(0, COLORS.primary);
  gradient.addColorStop(1, COLORS.secondary);
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 250, 0, 2 * Math.PI);
  ctx.fill();
  
  // Add CRYB text
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 120px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CRYB', centerX, centerY);
  
  // Add tagline
  ctx.font = 'normal 32px Arial';
  ctx.fillText('Next-Generation Community Platform', centerX, centerY + 180);
  
  return canvas.toBuffer('image/png');
}

// Create favicon (48x48)
function createFavicon() {
  const canvas = createCanvas(48, 48);
  const ctx = canvas.getContext('2d');
  
  // Black background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, 48, 48);
  
  // Create gradient circle
  const gradient = ctx.createRadialGradient(24, 24, 0, 24, 24, 20);
  gradient.addColorStop(0, COLORS.primary);
  gradient.addColorStop(1, COLORS.secondary);
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(24, 24, 18, 0, 2 * Math.PI);
  ctx.fill();
  
  // Add C letter
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('C', 24, 24);
  
  return canvas.toBuffer('image/png');
}

// Generate all icons
try {
  console.log('Generating CRYB app icons...');
  
  fs.writeFileSync('icon.png', createMainIcon());
  console.log('✓ Created icon.png (1024x1024)');
  
  fs.writeFileSync('adaptive-icon.png', createAdaptiveIcon());
  console.log('✓ Created adaptive-icon.png (1024x1024)');
  
  fs.writeFileSync('splash.png', createSplashScreen());
  console.log('✓ Created splash.png (1284x2778)');
  
  fs.writeFileSync('favicon.png', createFavicon());
  console.log('✓ Created favicon.png (48x48)');
  
  console.log('\n🎉 All CRYB app icons generated successfully!');
  console.log('📱 Icons are ready for mobile app builds');
  
} catch (error) {
  console.error('Error generating icons:', error.message);
  console.log('💡 Note: This requires the canvas npm package to be installed');
  console.log('Install with: npm install canvas');
}