const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeParamPackages() {
  let browser;
  try {
    console.log('Launching browser with enhanced anti-detection...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });

    const page = await browser.newPage();

    // Set more realistic browser fingerprint
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Set viewport to common desktop size
    await page.setViewport({ width: 1920, height: 1080 });

    // Set comprehensive HTTP headers
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8,zh-CN;q=0.7,zh;q=0.6',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    });

    // Remove webdriver property to avoid detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    // Set authentication cookies using page.setExtraHTTPHeaders
    if (process.env.USIM_COOKIE) {
      console.log('Setting authentication cookie via headers...');
      // Set cookie via headers instead of setCookie method
      await page.setExtraHTTPHeaders({
        'Cookie': `PHPSESSID=${process.env.USIM_COOKIE}`
      });
      console.log('Cookie header set successfully');
    } else {
      console.log('No USIM_COOKIE provided');
    }

    console.log('Step 1: Navigating to main USIM page first...');
    await page.goto('https://www.usim.vn', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait and check if we're blocked
    await new Promise(resolve => setTimeout(resolve, 3000));
    const mainPageBlocked = await page.evaluate(() => {
      return document.body.textContent?.includes('请不要非法访问') || false;
    });

    if (mainPageBlocked) {
      console.log('Main page blocked. Trying alternative approach...');
      // Try to navigate directly to products page
      console.log('Step 2: Direct navigation to products page...');
      await page.goto('https://www.usim.vn/esim_order/single.html', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
    } else {
      console.log('Main page loaded successfully');
      // Wait a bit then navigate to products
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Step 2: Navigating to products page...');
      await page.goto('https://www.usim.vn/esim_order/single.html', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
    }

    console.log('Step 3: Waiting for page to load completely...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check if we're blocked
    const isBlocked = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('请不要非法访问') || bodyText.includes('非法访问');
    });

    if (isBlocked) {
      console.log('❌ Anti-bot protection detected. Trying to bypass...');

      // Try to reload the page
      console.log('Reloading page...');
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check again
      const stillBlocked = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        return bodyText.includes('请不要非法访问') || bodyText.includes('非法访问');
      });

      if (stillBlocked) {
        console.log('❌ Still blocked. Saving debug info and exiting...');
        const content = await page.content();
        fs.writeFileSync('page-content-blocked.html', content);
        await page.screenshot({ path: 'page-screenshot-blocked.png', fullPage: true });
        console.log('Debug files saved: page-content-blocked.html, page-screenshot-blocked.png');
        return [];
      }
    }

    console.log('✅ Page loaded successfully');

    // Save page content for debugging
    const content = await page.content();
    fs.writeFileSync('page-content.html', content);
    console.log('Page content saved to page-content.html');

    // Take screenshot
    await page.screenshot({ path: 'page-screenshot.png', fullPage: true });
    console.log('Screenshot saved to page-screenshot.png');

    // Check if content contains products
    const hasProducts = content.includes('data-code') && content.includes('layui-table');
    console.log('Page contains product data:', hasProducts);

    if (!hasProducts) {
      console.log('No product data found. Page might be protected or not loaded correctly.');
      return [];
    }

    // Extract product information using multiple strategies
    const products = await page.evaluate(() => {
      const productList = [];

      // Strategy 1: Find table rows with data-index
      const rows = document.querySelectorAll('tr[data-index]');
      rows.forEach((row, index) => {
        try {
          const country = row.querySelector('td[data-field="country"]')?.textContent?.trim();
          const name = row.querySelector('td[data-field="name"]')?.textContent?.trim();
          const buttons = row.querySelectorAll('a[data-code]');

          buttons.forEach(button => {
            const dataCode = button.getAttribute('data-code');
            const dataType = button.getAttribute('data-type');
            const dataName = button.getAttribute('data-name');

            if (dataCode && country && name) {
              productList.push({
                index,
                country,
                name,
                dataCode,
                dataType,
                dataName,
                fullName: `${name} (${dataType})`,
                source: 'table_row'
              });
            }
          });
        } catch (error) {
          console.error('Error parsing row:', error);
        }
      });

      // Strategy 2: Find all buttons with data-code
      if (productList.length === 0) {
        const allButtons = document.querySelectorAll('[data-code]');
        allButtons.forEach(button => {
          const dataCode = button.getAttribute('data-code');
          const dataType = button.getAttribute('data-type') || 'esim';
          const dataName = button.getAttribute('data-name') || button.textContent?.trim() || '';

          if (dataCode) {
            productList.push({
              dataCode,
              dataType,
              dataName,
              fullName: `${dataName} (${dataType})`,
              source: 'data_code_attr'
            });
          }
        });
      }

      return productList;
    });

    console.log(`Found ${products.length} products with data codes:`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.fullName || product.dataName} -> ${product.dataCode} (${product.source})`);
    });

    // Save to JSON file
    fs.writeFileSync('param_packages.json', JSON.stringify(products, null, 2));
    console.log('Saved param_packages.json');

    // Generate PRODUCT_MAPPING code
    if (products.length > 0) {
      console.log('\n=== PRODUCT_MAPPING Code ===\n');
      console.log('// Product mapping for USIM param_package');
      console.log('const PRODUCT_MAPPING: { [key: string]: string } = {');

      products.forEach(product => {
        if (product.fullName && product.dataCode) {
          console.log(`  "${product.fullName}": "${product.dataCode}",`);
        }
      });

      console.log('};\n');
    }

    return products;

  } catch (error) {
    console.error('Scraping failed:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the scraper
scrapeParamPackages().catch(console.error);