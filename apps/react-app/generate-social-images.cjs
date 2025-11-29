/**
 * Generate Social Share Images
 * Creates og:image and twitter-card using Radix icons
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// HTML template for Open Graph image (1200x630)
const ogImageHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 630px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      text-align: center;
      color: white;
    }
    .icon {
      font-size: 120px;
      margin-bottom: 30px;
      filter: drop-shadow(0 10px 30px rgba(0,0,0,0.3));
    }
    .title {
      font-size: 72px;
      font-weight: 800;
      margin-bottom: 20px;
      letter-spacing: -2px;
    }
    .subtitle {
      font-size: 32px;
      font-weight: 400;
      opacity: 0.95;
      max-width: 800px;
      margin: 0 auto;
    }
    .badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 18px;
      margin-top: 30px;
      backdrop-filter: blur(10px);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">💬</div>
    <div class="title">CRYB Platform</div>
    <div class="subtitle">Next-generation community platform where conversations come alive</div>
    <div class="badge">🚀 Join the conversation</div>
  </div>
</body>
</html>
`;

// HTML template for Twitter Card (1200x600)
const twitterCardHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 600px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      text-align: center;
      color: white;
    }
    .icon {
      font-size: 100px;
      margin-bottom: 25px;
      filter: drop-shadow(0 10px 30px rgba(0,0,0,0.3));
    }
    .title {
      font-size: 64px;
      font-weight: 800;
      margin-bottom: 15px;
      letter-spacing: -2px;
    }
    .subtitle {
      font-size: 28px;
      font-weight: 400;
      opacity: 0.95;
      max-width: 700px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">💬</div>
    <div class="title">CRYB Platform</div>
    <div class="subtitle">The next-generation community platform</div>
  </div>
</body>
</html>
`;

async function generateImages() {
  console.log('🎨 Generating social share images...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Generate Open Graph image (1200x630)
    console.log('📸 Creating Open Graph image (1200x630)...');
    await page.setContent(ogImageHTML);
    await page.setViewport({ width: 1200, height: 630 });
    const ogImagePath = path.join(__dirname, 'public', 'icons', 'og-image.png');
    await page.screenshot({
      path: ogImagePath,
      type: 'png'
    });
    console.log(`✅ Open Graph image saved: ${ogImagePath}`);

    // Generate Twitter Card (1200x600)
    console.log('📸 Creating Twitter Card image (1200x600)...');
    await page.setContent(twitterCardHTML);
    await page.setViewport({ width: 1200, height: 600 });
    const twitterCardPath = path.join(__dirname, 'public', 'icons', 'twitter-card.png');
    await page.screenshot({
      path: twitterCardPath,
      type: 'png'
    });
    console.log(`✅ Twitter Card image saved: ${twitterCardPath}`);

    console.log('\n🎉 Social share images generated successfully!');
    console.log('\n📋 Files created:');
    console.log(`  - ${ogImagePath}`);
    console.log(`  - ${twitterCardPath}`);

    console.log('\n🔗 These images will be used when sharing:');
    console.log('  - Facebook, LinkedIn: og-image.png (1200x630)');
    console.log('  - Twitter/X: twitter-card.png (1200x600)');

  } catch (error) {
    console.error('❌ Error generating images:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the generator
generateImages()
  .then(() => {
    console.log('\n✨ Done! Rebuild the frontend to include the new images.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
