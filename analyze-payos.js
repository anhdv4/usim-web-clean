// Analyze PayOS API calls from working website
const puppeteer = require('puppeteer');

async function analyzePayOS() {
  console.log('🚀 Analyzing PayOS from working website...\n');

  const browser = await puppeteer.launch({
    headless: false, // Set to true for production
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Listen for network requests
    const payosRequests = [];

    page.on('request', (request) => {
      if (request.url().includes('payos.vn') && request.method() === 'POST') {
        console.log('📡 PayOS API Request detected:', request.url());
        payosRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('payos.vn')) {
        try {
          const responseBody = await response.json();
          console.log('📥 PayOS API Response:', response.url(), responseBody);
        } catch (e) {
          console.log('📥 PayOS API Response (non-JSON):', response.url());
        }
      }
    });

    console.log('🌐 Navigating to working PayOS website...');
    await page.goto('https://telebox.vn/checkout/01994e75-ba44-7000-8eed-fe621ae878ec/checkout', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('⏳ Waiting for PayOS interactions...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Try to trigger a payment if possible
    try {
      // Look for payment buttons
      const paymentButtons = await page.$$('[data-testid*="pay"], button, [class*="pay"], [class*="checkout"]');
      if (paymentButtons.length > 0) {
        console.log('🔘 Found payment buttons, clicking first one...');
        await paymentButtons[0].click();
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (e) {
      console.log('⚠️ Could not trigger payment automatically');
    }

    console.log('📊 Analysis complete!');
    console.log('PayOS requests captured:', payosRequests.length);

    payosRequests.forEach((req, index) => {
      console.log(`\n--- Request ${index + 1} ---`);
      console.log('URL:', req.url);
      console.log('Method:', req.method);
      console.log('Headers:', JSON.stringify(req.headers, null, 2));

      if (req.postData) {
        try {
          const data = JSON.parse(req.postData);
          console.log('Body:', JSON.stringify(data, null, 2));

          // Analyze signature if present
          if (data.signature) {
            console.log('✅ Found signature:', data.signature);
            console.log('Signature length:', data.signature.length);
          }
        } catch (e) {
          console.log('Body (raw):', req.postData);
        }
      }
    });

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the analysis
analyzePayOS().catch(console.error);