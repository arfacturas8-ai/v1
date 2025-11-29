#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('Creating new Expo project for CRYB mobile app...');

// Set the token
process.env.EXPO_TOKEN = '9zH76AUhi5_HzrOL1TbdjuxAtWBIxYfJfxrM2_kO';

try {
  // First, let's check current user
  const user = execSync('npx expo whoami', { encoding: 'utf-8' }).trim();
  console.log(`Logged in as: ${user}`);
  
  // Remove old project ID from app.json
  const appJsonPath = './app.json';
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
  
  // Clean up extra.eas if it exists
  if (appJson.expo.extra && appJson.expo.extra.eas) {
    delete appJson.expo.extra.eas;
  }
  
  // Set owner to match the logged-in user
  appJson.expo.owner = user;
  
  // Write back clean app.json
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  console.log('Cleaned up app.json');
  
  // Now try to register the project
  console.log('Registering project with Expo...');
  try {
    const result = execSync('npx expo register', { encoding: 'utf-8', stdio: 'pipe' });
    console.log('Project registered:', result);
  } catch (e) {
    console.log('Project may already be registered or error occurred:', e.message);
  }
  
  // Initialize EAS
  console.log('Initializing EAS...');
  try {
    // Generate a new UUID for the project
    const uuid = require('crypto').randomUUID();
    
    // Add the project ID back
    const appJsonUpdated = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
    if (!appJsonUpdated.expo.extra) {
      appJsonUpdated.expo.extra = {};
    }
    appJsonUpdated.expo.extra.eas = { projectId: uuid };
    fs.writeFileSync(appJsonPath, JSON.stringify(appJsonUpdated, null, 2));
    
    console.log(`Added project ID: ${uuid}`);
  } catch (e) {
    console.error('Error initializing EAS:', e.message);
  }
  
  console.log('\n✅ Setup complete! You can now run:');
  console.log('eas build --platform android --profile preview');
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}