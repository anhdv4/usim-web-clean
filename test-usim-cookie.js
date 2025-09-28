const puppeteer = require('puppeteer');

async function testUsimCookie() {
  console.log('🔍 Testing USIM.VN cookie login...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // Set authentication cookie
    await page.setCookie({
      name: 'PHPSESSID',
      value: '6b87ed7161a0fbf25942becf625bdef8',
      domain: 'www.usim.vn',
      path: '/',
      httpOnly: false,
      secure: true
    });

    console.log('📝 Cookie set, navigating to dashboard...');

    // Navigate to dashboard
    await page.goto('https://www.usim.vn/index/welcome.html', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const currentUrl = page.url();
    const pageTitle = await page.title();

    console.log('📍 Current URL:', currentUrl);
    console.log('📄 Page Title:', pageTitle);

    // Check login status
    const isLoggedIn = currentUrl.includes('welcome') ||
                      currentUrl.includes('index') ||
                      pageTitle.includes('Console') ||
                      pageTitle.includes('USIM');

    if (isLoggedIn) {
      console.log('✅ LOGIN SUCCESS: Cookie is still valid!');

      // Try to access order page to verify full access
      await page.goto('https://www.usim.vn/usim_order/buy.html', {
        waitUntil: 'networkidle2',
        timeout: 15000
      });

      const orderUrl = page.url();
      console.log('📍 Order page URL:', orderUrl);

      if (orderUrl.includes('buy.html')) {
        console.log('✅ FULL ACCESS: Can access order pages');
      } else {
        console.log('⚠️ LIMITED ACCESS: Cannot access order pages');
      }

    } else {
      console.log('❌ LOGIN FAILED: Cookie has expired or is invalid');

      // Check if redirected to login page
      if (currentUrl.includes('login')) {
        console.log('🔄 Redirected to login page - cookie expired');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testUsimCookie().catch(console.error);