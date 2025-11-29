const { chromium } = require('playwright');

async function testApp() {
  console.log('Starting browser test...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    console.log(text);
    consoleMessages.push(text);
  });
  
  // Capture errors
  page.on('pageerror', error => {
    const text = `[PAGE ERROR] ${error.message}`;
    console.log(text);
    consoleMessages.push(text);
  });
  
  try {
    console.log('Navigating to http://localhost:3007...');
    await page.goto('http://localhost:3007', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    // Wait a bit for React to potentially render
    await page.waitForTimeout(2000);
    
    // Check if root has content
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        exists: !!root,
        innerHTML: root ? root.innerHTML : null,
        hasContent: root ? root.innerHTML.trim().length > 0 : false
      };
    });
    
    console.log('\n=== ROOT ELEMENT STATUS ===');
    console.log('Root exists:', rootContent.exists);
    console.log('Has content:', rootContent.hasContent);
    console.log('Content length:', rootContent.innerHTML ? rootContent.innerHTML.length : 0);
    
    if (rootContent.innerHTML && rootContent.innerHTML.length < 500) {
      console.log('Content preview:', rootContent.innerHTML.substring(0, 200));
    }
    
    // Check for any visible text
    const visibleText = await page.evaluate(() => {
      return document.body.innerText.substring(0, 500);
    });
    
    console.log('\n=== VISIBLE TEXT ===');
    console.log(visibleText);
    
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

testApp().catch(console.error);