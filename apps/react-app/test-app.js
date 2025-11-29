const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log('BROWSER CONSOLE:', msg.type().toUpperCase(), msg.text());
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  try {
    console.log('Navigating to http://localhost:3007');
    await page.goto('http://localhost:3007', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });

    console.log('Page loaded successfully');

    // Check if React root is rendering
    await page.waitForSelector('#root', { timeout: 10000 });
    console.log('React root element found');

    // Check if the app actually rendered content
    const bodyContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        hasContent: root && root.innerHTML.trim().length > 0,
        contentLength: root ? root.innerHTML.length : 0,
        rootChildren: root ? root.children.length : 0,
        bodyText: document.body.innerText.slice(0, 200)
      };
    });

    console.log('App rendering status:', bodyContent);

    // Check for React components
    const reactRendered = await page.evaluate(() => {
      // Check for common React patterns
      const hasReactElements = document.querySelector('[data-reactroot]') || 
                              document.querySelector('[data-react-helmet]') ||
                              document.querySelector('.layout') ||
                              document.querySelector('nav') ||
                              document.querySelector('main');
      return !!hasReactElements;
    });

    console.log('React components detected:', reactRendered);

    // Take a screenshot for debugging
    await page.screenshot({ path: '/tmp/app-screenshot.png' });
    console.log('Screenshot saved to /tmp/app-screenshot.png');

    // Get page title
    const title = await page.title();
    console.log('Page title:', title);

  } catch (error) {
    console.log('ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();