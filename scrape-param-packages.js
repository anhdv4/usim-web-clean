const puppeteer = require('puppeteer');

async function scrapeParamPackages() {
  let browser;
  try {
    console.log('Launching browser...');
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
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });

    // Try to set authentication cookies if available
    try {
      if (process.env.USIM_COOKIE) {
        await page.setCookie({
          name: 'PHPSESSID',
          value: process.env.USIM_COOKIE,
          domain: 'www.usim.vn',
          path: '/',
          httpOnly: false,
          secure: true
        });
        console.log('Cookie set successfully');
      } else {
        console.log('No USIM_COOKIE provided, trying without authentication');
      }
    } catch (cookieError) {
      console.log('Failed to set cookie, continuing without authentication:', cookieError.message);
    }

    console.log('Navigating to eSIM single order page...');
    await page.goto('https://www.usim.vn/esim_order/single.html', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Debug: Save page content
    const content = await page.content();
    require('fs').writeFileSync('page-content.html', content);
    console.log('Page content saved to page-content.html');

    // Debug: Take screenshot
    await page.screenshot({ path: 'page-screenshot.png', fullPage: true });
    console.log('Screenshot saved to page-screenshot.png');

    // Extract product information
    const products = await page.evaluate(() => {
      const productList = [];

      // Find all order buttons
      const buttons = document.querySelectorAll('.onebtn, button[data-code], [data-type]');

      buttons.forEach(button => {
        const buttonText = button.textContent?.trim() || '';
        const dataCode = button.getAttribute('data-code') || '';
        const dataType = button.getAttribute('data-type') || '';
        const onclick = button.getAttribute('onclick') || '';

        // Extract param_package from onclick or href
        let paramPackage = '';
        if (onclick.includes('param_package')) {
          const match = onclick.match(/param_package[\/=]([a-f0-9]{32})/);
          if (match) paramPackage = match[1];
        }

        // Also check for links
        const link = button.closest('a');
        if (link && link.href.includes('param_package')) {
          const match = link.href.match(/param_package[\/=]([a-f0-9]{32})/);
          if (match) paramPackage = match[1];
        }

        if (paramPackage && buttonText) {
          productList.push({
            name: buttonText,
            param_package: paramPackage,
            data_code: dataCode,
            data_type: dataType,
            url: `https://www.usim.vn/usim_order/buy_one/type/esim/param_package/${paramPackage}.html`
          });
        }
      });

      return productList;
    });

    console.log(`Found ${products.length} products with param_package:`);
    products.forEach(product => {
      console.log(`${product.name} -> ${product.param_package}`);
    });

    // Save to file
    const fs = require('fs');
    fs.writeFileSync('param_packages.json', JSON.stringify(products, null, 2));
    console.log('Saved param_packages.json');

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